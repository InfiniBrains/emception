import {AssignmentBasev1_0_0} from "../assignments/assignment.base.v1.0.0";

const path = require('path');
import { CopyOutlined, PlayCircleFilled, UndoOutlined } from "@ant-design/icons";
import { Editor } from "@monaco-editor/react";
import {Breadcrumb, Button, Col, Layout, Menu, notification, Row, Space, Input, message} from "antd";
const { TextArea } = Input;

import * as Comlink from "comlink";
import { editor } from "monaco-editor";
import React, {useEffect, useRef, useState} from "react";
import { HelloWorldCPP } from "../assignments/intro-cpp/hello-world-cpp";
import Markdown from 'markdown-to-jsx'

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {write} from "node:fs";
import Emception from "./emception";

const CodeBlock = ({ children }: { children: React.ReactElement }) => {
  const { className, children: code } = children.props;

  const language = className?.replace("lang-", "");
  return (
      <SyntaxHighlighter language={language} style={dark}>
        {code}
      </SyntaxHighlighter>
  );
};

const { Header, Content, Footer } = Layout;


const containerStyle: React.CSSProperties = {
  width: '100%',
  height: 100,
  overflow: 'auto',
  border: '1px solid #40a9ff',
};

const style: React.CSSProperties = {
  width: '100%',
};

interface SyntaxTrainingPageProps {
  assignment?: AssignmentBasev1_0_0 | any; // add other versions here
  theme?: string;
  language?: string;
  height?: string;
}

const SyntaxTrainingPage: React.FC<SyntaxTrainingPageProps> = ({
                                                                 assignment = HelloWorldCPP,
                                                                 theme = "vs-dark",
                                                                 language = "cpp",
                                                                 height = "20vh"
                                                               }) => {
  const [cppFlags, setCppFlags] = useState("-O2 -fexceptions --proxy-to-worker -sEXIT_RUNTIME=1 -std=c++20");

  const [emceptionLoaded, setEmceptionLoaded] = useState(false);

  const [api, contextHolder] = notification.useNotification();
  let [consoleOutput, setConsoleOutput] = useState<string>("");

  const [emception, setEmception] = useState<Comlink.Remote<Emception> | null>(null);

  const writeLineToConsole = (str: any) => {
    console.log(str);
    consoleOutput+= str + "\n";
    console.log(consoleOutput);
    setConsoleOutput(consoleOutput);
  }

  const clearConsole = () => {
    setConsoleOutput("");
  }

  // todo: fix code styles
  const CodeBlock = ({ children }: { children: React.ReactElement }) => {
    const { className, children: code } = children.props;

    const language = className?.replace("lang-", "");
    return (
        <SyntaxHighlighter language={language}>
          {code}
        </SyntaxHighlighter>
    );
  };

  async function loadEmception(): Promise<any> {
    showNotification("Loading emception...");
    if(emceptionLoaded)
      return;
    setEmceptionLoaded(true);

    console.log("load worker");
    // todo: is it possible to not refer as url?
    const emceptionWorker = new Worker(new URL('./emception.worker.ts', import.meta.url), { type: 'module' });

    emceptionWorker.onerror = (e) => {
      console.error(e);
      showNotification("Emception worker error");
    }

    console.log("Post message to worker");

    //let emception: Comlink.Remote<Emception> = Comlink.wrap(emceptionWorker);
    let emception: Comlink.Remote<Emception> = Comlink.wrap(emceptionWorker);

    console.log("Post wrap");

    setEmception(emception);

    console.log("Post set");

    emception.onstdout.bind(console.log);
    emception.onstderr.bind(console.log);
    emception.onprocessstart.bind(console.log);
    emception.onprocessend.bind(console.log);

    console.log("Post bind");

    await emception.init();

    console.log("Post init");
    showNotification("Emception intialized");
  }

  useEffect(() => {
    loadEmception();
  }, []);

  let editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  let monacoRef = useRef(null);

  function handleEditorChange(value: any, event: any) {
    // here is the current value
    console.log(value);
    console.log('event', event);
  }

  function handleEditorDidMount(editor: editor.IStandaloneCodeEditor, monaco: any) {
    editorRef.current = editor;
    monacoRef.current = monaco;
    console.log('onMount: the editor instance:', editor);
    console.log('onMount: the monaco instance:', monaco);
  }

  function handleEditorWillMount(monaco: any) {
    monacoRef.current = monaco;
    console.log('beforeMount: the monaco instance:', monaco);
  }

  function handleEditorValidation(markers: any) {
    // model markers
    // markers.forEach(marker => console.log('onValidate:', marker.message));
  }

  const onprocessstart = (argv) => {
    writeLineToConsole(`\$ ${argv.join(" ")}`);
  };
  const onprocessend = () => {
    writeLineToConsole(`Process finished`);
  };

  const onRunClick = async () => {
    // try {
      clearConsole();
      if (!emception) {
        showNotification("Emception not loaded");
        console.log("Emception not loaded");
        return;
      }

      const code = editorRef.current?.getValue() || '';
      await emception.fileSystem.writeFile("/working/main.cpp", code);
      const cmd = `em++ ${cppFlags} -sSINGLE_FILE=1 -sUSE_CLOSURE_COMPILER=0 /working/main.cpp -o /working/main.js`;
      writeLineToConsole(`\$ ${cmd}`);
      const result = await emception.run(cmd);
      console.log(result);
      showNotification(JSON.stringify(result));
      if (result.returncode == 0) {
        writeLineToConsole("Emception compilation finished");
        const content = await emception.fileSystem.readFile("/working/main.js", { encoding: "utf8" });
        writeLineToConsole(content);
        eval(content);
      } else {
        writeLineToConsole(`Emception compilation failed`);
        writeLineToConsole(JSON.stringify(result));
      }
    // } catch (e) {
    //   writeLineToConsole(JSON.stringify(e));
    // }
  }

  const showNotification = (message: string) => {
    api.info({
      message: message,
      placement: 'topRight'
    });
  };

  const items = new Array(15).fill(null).map((_, index) => ({
    key: index + 1,
    label: `nav ${ index + 1 }`,
  }));

  const resetCode = () => {
    editorRef.current?.setValue(assignment.initialCode);
    showNotification('Code reset');
  }

  const copyCode = async () => {
    // await navigator.clipboard.writeText(editorRef.current?.getValue() || '')
  }

  return (
    <>
      { contextHolder }
      <Layout>
        <Header style={ { display: 'flex', alignItems: 'center' } }>
          <div className="demo-logo"/>
          <Menu
            theme="dark"
            mode="horizontal"
            defaultSelectedKeys={ ['2'] }
            items={ items }
            style={ { flex: 1, minWidth: 0 } }
          />
        </Header>

        <Content style={ { padding: '0 48px' } }>
          <Breadcrumb style={ { margin: '16px 0' } }
                      items={ [{ title: "Home" }, { title: "List" }, { title: "App" }] }/>
          <div
            style={ {
              // background: colorBgContainer,
              minHeight: 280,
              padding: 24,
              // borderRadius: borderRadiusLG,
            } }
          >
            <Space direction="vertical">
              <Markdown options={{forceBlock: true, overrides: { pre: { component: CodeBlock } } }}>
                {assignment.description}
              </Markdown>
              <Editor
                height={ height }
                defaultLanguage={ language }
                theme={ theme }
                defaultValue={ assignment.initialCode }
                onChange={ handleEditorChange }
                onMount={ handleEditorDidMount }
                beforeMount={ handleEditorWillMount }
                onValidate={ handleEditorValidation }
                options={ { automaticLayout: true, wordWrap: 'on' } }
              />
              <Row justify="space-between">
                <Col>
                  <Space direction="horizontal">
                    <Button type="primary" onClick={ onRunClick } icon={ <PlayCircleFilled/> }>Run</Button>
                  </Space>
                </Col>
                <Col>
                  <Button type="default" icon={ <UndoOutlined/> } onClick={ resetCode }>Reset code</Button>
                  <Button type="default" icon={ <CopyOutlined/> } onClick={ copyCode }>Copy code</Button>
                </Col>
              </Row>
              <TextArea disabled={true} autoSize={{ minRows: 2, maxRows: 6 }} value={consoleOutput}/>
            </Space>
          </div>
        </Content>
        <Footer style={ { textAlign: 'center' } }>GameGuild ©2023. Created by Alexandre Tolstenko.</Footer>
      </Layout>
    </>
  );
};

export default SyntaxTrainingPage;