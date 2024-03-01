#!/bin/bash
set -e

export $(cat .env | xargs)

SRC=$(dirname $0)
BUILD="$1"

if [ "$BUILD" == "" ]; then
    BUILD=$(pwd)/build
fi

SRC=$(realpath "$SRC")
BUILD=$(realpath "$BUILD")

if [ ! -d $BUILD/emception/ ]; then
    mkdir -p $BUILD/emception/
fi

cp $SRC/src/* $BUILD/emception/
cp $SRC/src/* $BUILD/emception/

mkdir -p $BUILD/emception/llvm/
cp $BUILD/llvm/bin/llvm-box.{mjs,wasm} $BUILD/emception/llvm/

mkdir -p $BUILD/emception/binaryen/
cp $BUILD/binaryen/bin/binaryen-box.{mjs,wasm} $BUILD/emception/binaryen/

mkdir -p $BUILD/emception/quicknode/
cp $BUILD/quicknode/quicknode.{mjs,wasm} $BUILD/emception/quicknode/

mkdir -p $BUILD/emception/cpython/
cp $BUILD/cpython/python.{mjs,wasm} $BUILD/emception/cpython/

mkdir -p $BUILD/emception/brotli/
cp $BUILD/brotli/brotli.{mjs,wasm} $BUILD/emception/brotli/

mkdir -p $BUILD/emception/wasm-package/
cp $BUILD/wasm-package/wasm-package.{mjs,wasm} $BUILD/emception/wasm-package/

echo "building packs"
$SRC/build-packs.sh $BUILD

echo "copying packs"
mkdir -p $BUILD/emception/packages
cp $BUILD/packs/*.pack $BUILD/emception/packages

echo "compressing packs"
EXT=".pack"
if [ "$EMCEPTION_NO_COMPRESS" != "1" ]; then
    # Use brotli compressed packages
    EXT=".pack.br"
    for PACK in $BUILD/emception/packages/*.pack; do
        PACK=$(basename $PACK .pack)
        echo ${PACK}
        brotli --best --keep $BUILD/emception/packages/$PACK.pack
    done
fi

IMPORTS=""
EXPORTS=""
for PACK in $BUILD/emception/packages/*.pack; do
    PACK=$(basename $PACK .pack)
    NAME=$(echo $PACK | sed 's/[^a-zA-Z0-9_]/_/g')
    IMPORTS=$(printf \
        "%s\nimport %s from \"./packages/%s\";" \
        "$IMPORTS" "$NAME" "$PACK$EXT" \
    )
    EXPORTS=$(printf \
        "%s\n    \"%s\": %s," \
        "$EXPORTS" "$PACK" "$NAME" \
    )
done
printf '%s\nexport default {%s\n};' "$IMPORTS" "$EXPORTS" > "$BUILD/emception/packs.mjs"
