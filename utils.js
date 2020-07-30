
let utils= {
    colors: {
        red(s){ return `\u001b[31m${ s }\u001b[39m`; },
        green(s){ return `\u001b[32m${ s }\u001b[39m`; },
        yellow(s){ return `\u001b[33m${ s }\u001b[39m`; },
        purple(s){ return `\u001B[35m${ s }\u001b[39m`; },
        blue(s){ return `\u001B[34m${ s }\u001b[39m`; },
        cyan(s){ return `\u001B[36m${ s }\u001b[39m`; },
        grey(s){ return `\u001b[90m${ s }\u001b[39m`; },
    },
    logBuild(){
        const date = new Date();
        let hours = date.getHours().toString();
        let minutes = date.getMinutes().toString();
        let seconds = date.getSeconds().toString();
        if(hours.length === 1){ hours = '0' + hours; }
        if(minutes.length === 1){ minutes = '0' + minutes; }
        if(seconds.length === 1){ seconds = '0' + seconds; }
        const dateString = `[${hours}:${minutes}:${seconds}]`;
        console.log(`${utils.colors.green('√')} ${utils.colors.grey(dateString)}`);
    }
}

module.exports = utils;