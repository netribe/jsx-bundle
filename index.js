const fs = require('fs');
const path = require('path');
const rollup = require('rollup');
const babel = require('@rollup/plugin-babel').default;
const nodeResolve = require('@rollup/plugin-node-resolve').nodeResolve;
const commonjs = require('@rollup/plugin-commonjs');
const progress = require('rollup-plugin-progress');
const replace = require('rollup-plugin-replace');
const DevServer = require('./DevServer.js');
const utils = require('./utils.js');

let argsArray = process.argv.slice(2);
let args = {
    "external": ['react', 'react-dom'],
    "port": [8080],
    "ws-port": [4040]
};
let index = 0;
let lastElement, fromFile, toFile, devServer;

while(index < argsArray.length){
    let element = argsArray[index];
    if(element.indexOf('--') === 0){
        element = element.replace('--', '');
        args[element] = [];
        lastElement = element;
    }
    else if(lastElement){
        args[lastElement].push(element);
    }
    else if(!fromFile){
        fromFile = element;
    }
    else if(!toFile){
        toFile = element;
    }
    index++;
}



const inputOptions = {
    input: fromFile,
    plugins: [
        replace({
            'process.env.NODE_ENV': JSON.stringify('production')
        }),
        nodeResolve(),
        commonjs(),
        babel({
            "babelHelpers": "bundled",
            "presets": [
                require("@babel/preset-env"),
                require("@babel/preset-react")
            ],
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
        }),
        progress()
    ],
    external: args['external']
};
const component = `
import React from 'react';

export default class //name// extends React.Component{
    constructor(props){
        super(props);
    }

    componentDidMount(){}

    componentWillUnmount(){}

    render(){
        return <div>//name//</div>
    }
}
`;
const dllWrapper = `
(function(){
    var mod = typeof module !== 'undefined' ? module : {exports: {}};
    var req = typeof require !== 'undefined' ? require : function (name){
        return window.node_modules && window.node_modules[name];
    }
    var build = function(require, module, exports){

        //body//
        //tail//
    }
    build(req, mod, mod.exports);
    if(typeof window !== 'undefined'){
        window.node_modules = window.node_modules || {};
        if(typeof mod.exports === 'function'){
            node_modules[mod.exports.displayName || mod.exports.name] = mod.exports;
        }
        else if(toString.call(mod.exports) === '[object Object]'){
            Object.assign(node_modules, mod.exports);
        }
        else{
            console.warn('module.exports should be an object or a function. check the log below.');
            console.log(mod.exports);
        }
    }
})()
`.split('//body//');

dllWrapper[1] = dllWrapper[1].replace('//tail//', toFile ? '' : `require('react-dom').render(require('react').createElement(module.exports), document.getElementById('app'));`);

const outputOptions = {
    file: toFile || path.join(__dirname, 'bundle.js'),
    format: 'cjs',
    exports: "default",
    intro: (args.dll || !toFile) ? dllWrapper[0] : '',
    outro: (args.dll || !toFile) ? dllWrapper[1] : '',
};

const createComponentFile = filePath => {
    let name = filePath.slice(filePath.lastIndexOf('/') + 1, filePath.lastIndexOf('.'))
    fs.writeFileSync(filePath, component.split('//name//').join(name));
};

async function build() {
    if(!toFile){
        if (!fs.existsSync(fromFile)){
            createComponentFile(fromFile);
        }
        // start a live-reloading dev server
        devServer = DevServer({
            port: args.port[0],
            wsPort: args["ws-port"][0],
        });
        let watcher = rollup.watch({
            ...inputOptions,
            output: outputOptions,
            watch: {}
        });
        watcher.on('event', async event => {
            if(event.code === 'ERROR'){
                if(event.error && (event.error.code === 'UNRESOLVED_IMPORT')){
                    let error = event.error.toString();
                    let filePath = error.split(/[\'\"]/)[1];
                    if(filePath && (filePath.indexOf('.') === 0) && (filePath.indexOf('.jsx') === filePath.length - 4)){
                        let baseFile = event.error.watchFiles && event.error.watchFiles[0];
                        if(baseFile){
                            let baseDir = baseFile.substr(0, baseFile.lastIndexOf('/'));
                            createComponentFile(path.resolve(baseDir, filePath));
                            return fs.appendFileSync(baseFile, '\n')
                        }
                    }
                }
                console.log();
                console.log(event.error && event.error.toString() || event);
            }
            else if(event.code === 'BUNDLE_END'){
                const { output } = await event.result.generate(outputOptions);
                utils.logBuild();
                devServer.reload(output[0].code);
            }
        });
    }
    else if(args.watch){
        await rollup.watch({
            ...inputOptions,
            output: [outputOptions],
            watch: {}
        });
    }
    else{
        const bundle = await rollup.rollup(inputOptions);
        const { output } = await bundle.generate(outputOptions);
        await bundle.write(outputOptions);
    }
}

const onExit = (type, e) => {
    if(type === 'uncaughtException'){
        console.log(e)
    }
    if(devServer){
        devServer.close();
    }
    if(type !== 'exit'){
        process.exit();
    }
};
[`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach((eventType) => {
    process.on(eventType, e => onExit(eventType, e));
});

build().catch(err => {
    
    console.log(1)
    console.log(err)
});


