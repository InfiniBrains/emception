'use client';
import {DatePicker, Space} from 'antd';
import { Button } from 'antd';

import Editor, {Monaco} from "@monaco-editor/react";
import { Terminal } from "xterm";
import { FitAddon } from 'xterm-addon-fit';
import Split from "split-grid";
import { spinner, previewTemplate, miniBrowserTemplate } from "./preview-template.mjs";

import { render, html } from "lit";

import EmceptionWorker from "./emception.worker.js";

import "./style.css";
import "xterm/css/xterm.css";
import React from "react";
import {editor} from "monaco-editor";
import IModelContentChangedEvent = editor.IModelContentChangedEvent;
import Emception from "@/app/emception";

const emception = Emception;

async function run() {
    console.log("run");
}
export default function Home() {
    // const emception = EmceptionWorker;
    // const editorContainer = document.createElement("div");
    // const editor = monaco.editor.create(editorContainer, {
    //     value: "",
    //     language: "cpp",
    //     theme: "vs-dark",
    // });

    // const terminalContainer = document.createElement("div");
    // const terminal = new Terminal({
    //     convertEol: true,
    //     theme: {
    //         background: "#1e1e1e",
    //         foreground: "#d4d4d4",
    //     },
    // });
    // terminal.open(terminalContainer);

    // const terminalFitAddon = new FitAddon();
    // terminal.loadAddon(terminalFitAddon);



    // emception.onstdout = Comlink.proxy((str: string) => terminal.write(str + "\n"));
    // emception.onstderr = Comlink.proxy((str: string) => terminal.write(str + "\n"));

    // window.addEventListener("resize", () => {
    //     editor.layout();
    //     terminalFitAddon.fit();
    // });

    const initialCode = `#include <iostream>
int main(void) {
    std::cout << "hello world!\\n";
    return 0;
}`;

    const [code, setCode] = React.useState(initialCode);

    const run = async () => {
        console.log("run");
        const emception = new Emception();
        console.log('init');
        await emception.init();
        console.log('run');
    };

    return <Space direction="vertical">
        <Button onClick={run}>Run</Button>
        <Editor height="90vh" defaultLanguage="cpp" defaultValue={initialCode} theme='vs-dark' language='cpp' onChange={(value: string | undefined, ev: IModelContentChangedEvent)=>{
            if (value) {
                setCode(value);
            }
        } } />
    </Space>
}
