# npm-package-collect

A command line tool to collect npm package dependencies from multiple npm projects

## Install

```bash
npm install -g npm-package-collect
```

## Usage

```bash
npm-package-collect <path/to/project1> <path/to/project2> --output=<output-file>
npm-package-collect <path/to/project1> <path/to/project2> -o=<output-file>
```

That will create a folder named `npm-package-collected` at `<output-file>`, which is a npm project with all the dependencies of the projects you specified. It also contains a tar file named `node_modules.tar.gz` which contains all the dependencies.