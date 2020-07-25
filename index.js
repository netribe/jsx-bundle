const path = require('path');
const rollup = require('rollup');
const babel = require('@rollup/plugin-babel').default;
const nodeResolve = require('@rollup/plugin-node-resolve').nodeResolve;
const commonjs = require('@rollup/plugin-commonjs');

let command = process.argv[2];
let argsArray = process.argv.slice(3);
let args = {
    external: ['react', 'react-dom']
};
let index = 0;
let lastElement;
while(index < argsArray.length){
    let element = argsArray[index];
    if(element.indexOf('-') === 0){
        element = element.replace('-', '').replace('-', '');
        args[element] = [];
        lastElement = element;
    }
    else if(lastElement){
        args[lastElement].push(element);
    }
    index++;
}

if(command === 'build'){
    
    const inputOptions = {
        input: args['from'][0],
        plugins: [babel({
            "babelHelpers": "bundled",
            "presets": [require("@babel/preset-env"),require("@babel/preset-react")],
            "plugins": [
                require("@babel/plugin-proposal-class-properties"),
                [require("@babel/plugin-proposal-decorators"), {"decoratorsBeforeExport": true}],
                require("@babel/plugin-proposal-do-expressions"),
                require("@babel/plugin-proposal-function-bind"),
                require("@babel/plugin-proposal-function-sent"),
                require("@babel/plugin-proposal-object-rest-spread"),
                require("@babel/plugin-proposal-optional-chaining"),
                [require("@babel/plugin-proposal-pipeline-operator"), {"proposal": "minimal"}]
            ]
        }), nodeResolve(), commonjs()],
        external: args['external']
    };

    const outputOptions = {
        file: args['to'][0],
        format: 'cjs',
        exports: "default"
    };
    
    async function build() {
        const bundle = await rollup.rollup(inputOptions);
        const { output } = await bundle.generate(outputOptions);
        await bundle.write(outputOptions);
    }

    build().catch(err => {
        console.log(err)
    });
}


