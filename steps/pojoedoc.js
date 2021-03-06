#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const index_1 = require("./index");
process.env.NODE_PATH = `${process.cwd()}/steps`;
require("module").Module._initPaths();
const readme = 'README.md';
const decls = {};
let pkg;
try {
    pkg = JSON.parse(fs.readFileSync('./package.json', { encoding: 'utf8' }));
}
catch (e) {
    console.error(`unable to read package.json in directory ${process.cwd()} `);
    process.exit(1);
}
if (!pkg.config || !pkg.config.steps || !Array.isArray(pkg.config.steps)) {
    console.error("unable to find steps list in package.json \n");
    console.log(`
    please configure your step list in package.json like:
    {
        ...
        "config" :{
            "steps" : [ "StepClass1", "StepClass2", "StepClass3" ]
        },
        ...
    }\n`);
    process.exit(1);
}
if (!pkg.repository || !pkg.repository || pkg.repository.type !== 'git' || !pkg.repository.url) {
    console.error("unable to find correct repository configuration in package.json \n");
    console.log(`
    please configure your repository in package.json like:
    {
        ...
        "repository": {
            "type": "git",
            "url": "git+https://github.com/mbenzekri/pojoe.git"
        },
            ...
    }\n`);
    process.exit(1);
}
const steplist = pkg.config.steps;
steplist.forEach(name => {
    const account = pkg.repository.url.replace(/^.*github.com\//, '').replace(/\/.*$/, '');
    const pathmod = `${name}`;
    try {
        let module = require(pathmod);
        let gitid = `${account}/${pkg.name}/steps/${name}`;
        module = index_1.Step.getstep(gitid);
        if (!module) {
            console.error(`unable to get module ${gitid} from registry `);
            process.exit(1);
        }
        decls[name] = module.declaration;
    }
    catch (e) {
        console.error(`unable to require module ${pathmod} due to ${e.message} `);
        process.exit(2);
    }
});
let repository;
steplist.forEach(name => {
    const decl = decls[name];
    const ids = decl.gitid.split(/\//);
    repository = `${ids[0]}/${ids[1]}`;
});
//fs.writeFileSync(readme,'<div style="border-width: 2px;border-color: red;border-radius: 10px">\n')
fs.writeFileSync(readme, '\n');
fs.appendFileSync(readme, `# ${pkg.name}${pkg.title ? ': ' + pkg.title : ''}\n`);
fs.appendFileSync(readme, `>${pkg.description}\n`);
//fs.writeFileSync(readme,'</div>\n\n')
fs.appendFileSync(readme, `# install\n\n`);
fs.appendFileSync(readme, `>\`npm install ${repository}\`\n\n`);
fs.appendFileSync(readme, `# included steps \n`);
steplist.forEach(name => {
    const decl = decls[name];
    const ids = decl.gitid.split(/\//);
    const classname = ids[3];
    //fs.appendFileSync(readme,`\n<detail>\n`)
    //fs.appendFileSync(readme,`<summary>${name} : ${decl.title}</summary>\n`)
    fs.appendFileSync(readme, `>- [${name}](#${(classname + ' ' + decl.title).toLowerCase().replace(/ +/g, '-')}) : ${decl.title}\n`);
});
steplist.forEach(name => {
    if (name) {
        const decl = decls[name];
        const ids = decl.gitid.split(/\//);
        const classname = ids[3];
        fs.appendFileSync(readme, `# ${classname} ${decl.title}\n`);
        fs.appendFileSync(readme, `>\n\n`);
        fs.appendFileSync(readme, `## goal\n\n`);
        fs.appendFileSync(readme, `>${decl.desc}\n`);
        decl.features && decl.features.forEach(feature => {
            fs.appendFileSync(readme, `>- ${feature} \n`);
        });
        fs.appendFileSync(readme, '\n---\n');
        fs.appendFileSync(readme, `## parameters\n`);
        const hasParams = decl.parameters && Object.keys(decl.parameters).length;
        hasParams && Object.keys(decl.parameters).forEach(name => {
            const parameter = decl.parameters[name];
            fs.appendFileSync(readme, `> **${name}** *{${parameter.type}}* -- ${parameter.title}  -- default = \`${parameter.default}\`\n`);
            fs.appendFileSync(readme, `> \n`);
            parameter.examples && fs.appendFileSync(readme, `>| Value | Description | \n`);
            parameter.examples && fs.appendFileSync(readme, `>|-------|-------------| \n`);
            parameter.examples && parameter.examples.forEach(ex => {
                fs.appendFileSync(readme, `>|\`${ex.value}\`| ${ex.title} |\n`);
            });
        });
        const hasInputs = decl.inputs && Object.keys(decl.inputs).length;
        hasInputs && fs.appendFileSync(readme, `## inputs\n`);
        hasInputs && Object.keys(decl.inputs).forEach(name => {
            const input = decl.inputs[name];
            fs.appendFileSync(readme, `>- **${name}** -- ${input.title} \n`);
            input.properties && fs.appendFileSync(readme, `>> expected properties: \n`);
            input.properties && Object.keys(input.properties).forEach(name => {
                const property = input.properties[name];
                fs.appendFileSync(readme, `>>- **${name}** *{${property.type}}* -- ${property.title}\n`);
            });
        });
        fs.appendFileSync(readme, `\n`);
        const hasOuputs = decl.outputs && Object.keys(decl.outputs).length;
        hasOuputs && fs.appendFileSync(readme, `## outputs\n`);
        hasOuputs && Object.keys(decl.outputs).forEach(name => {
            const output = decl.outputs[name];
            fs.appendFileSync(readme, `>- **${name}** -- ${output.title} \n`);
            output.properties && fs.appendFileSync(readme, `>> provided properties: \n`);
            output.properties && Object.keys(output.properties).forEach(name => {
                const property = output.properties[name];
                fs.appendFileSync(readme, `>>- **${name}** *{${property.type}}* -- ${property.title}\n`);
            });
        });
        fs.appendFileSync(readme, `\n`);
        const hasExamples = decl.examples && decl.examples.length;
        hasExamples && fs.appendFileSync(readme, `## examples\n`);
        hasExamples && decl.examples.forEach(example => {
            fs.appendFileSync(readme, `### ${example.title}\n`);
            fs.appendFileSync(readme, `${example.title}\n`);
        });
        fs.appendFileSync(readme, `\n---\n\n`);
    }
    //fs.appendFileSync(readme,`\n</detail>\n`)
});
fs.appendFileSync(readme, `---\n`);
const jsonfile = './steps/steps.json';
let sep = '\n';
fs.writeFileSync(jsonfile, '[\n');
steplist.forEach(name => {
    const decl = decls[name];
    fs.appendFileSync(jsonfile, sep);
    fs.appendFileSync(jsonfile, JSON.stringify(decl, undefined, 4));
    sep = ',\n';
});
fs.appendFileSync(jsonfile, ']\n');
process.exit(0);
//# sourceMappingURL=pojoedoc.js.map