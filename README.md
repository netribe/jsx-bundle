# jsx-bundle
A pre-configured global bundler for JSX

## Installation
Install globally
```
npm i -g jsx-bundle
```

## Usage
### Development usage
```sh
jsx-bundle Test.jsx
```
This compiles and bundles your component and then opens it in your browser. the page will live-reload but no build files are created. 
> If the source file does not exist it will be created for you.

### Production usage

```sh
jsx-bundle src/Test.jsx dist/bundle.js
```
This compiles and bundles `src/Test.jsx` to `dist/bundle.js`.

## Options
Option | Description
--- | ---
<a href="#external">--external</a> | a list of modules to exclude from the bundle
<a href="#dlls">--dll</a> | compile this bundle as a dll that can be used by other bundles 
--watch | watch the source files and recompiles when they change
--port | the dev server's http port to use
--ws-port | the dev server's websocket port to use
--hot (not yet applicable) | enable hot reloading for this bundle

### External
The `--external` option tells the bundler which moduels should be excluded from the build, so any peer dependencies should be listed here.
`react` and `react-dom` are external by default but if you are using additional peer dependencies you should pass them in the `external` option along with `react` and `react-dom` (if you use them):
```sh
jsx-bundle src/Component.jsx dist/index.js --external react react-dom @material-ui/core
```

### DLLs

The `--dll` option lets your bundle use (or be used by) other DLL bundles, without having to bundle them all together. this may be usefull when bundling for a full application (rather than a single component or library), or if you want to load modules dynamically. your code is split between several DLL bundles and you only need to build the bundles that you're currently developing. the exports of your bundle can be imported by other DLL bundles and vise versa (although circular dependency is not supported).
```sh
jsx-bundle src/Test.jsx dist/bundle.js --dll
```
DLL bundles can export either an object with named modules:
```jsx
// myLibrary.js
import TextInput from './TextInput.jsx';
import BooleanSwitch from './BooleanSwitch.jsx';

export default {
    TextInput,
    BooleanSwitch
}
```
or a single React component:
```jsx
// TextEditor.jsx
import React from 'react';

export default class TextEditor extends React.Component { ... }
```
You can than import them to other DLLs using the component class name or the exported object's keys:
```jsx
import TextInput from 'TextInput';
import BooleanSwitch from 'BooleanSwitch';
import TextEditor from 'TextEditor';
```
Note that all the DLL modules share scope so proper namespacing may be a good idea.

# TODO
*   Some optimization for development and production builds
*   Hot Component Replacement
