# htmlclean

## Command Line Tool

```shell
htmlclean [options] [input1 [input2 ...]]
```

### Options

<table>
<tr><td><code>-h</code>, <code>--help</code></td><td>output usage information</td></tr>
<tr><td><code>-V</code>, <code>--version</code></td><td>output the version number</td></tr>
<tr><td><code>-i</code>, <code>--input &lt;input&gt;</code></td><td>input file, directory or <code>-</code> as STDIN</td></tr>
<tr><td><code>-o</code>, <code>--output &lt;output&gt;</code></td><td>output file, directory or <code>-</code> as STDOUT</td></tr>
<tr><td><code>-r</code>, <code>--root &lt;directory&gt;</code></td><td>root of directory tree</td></tr>
<tr><td><code>-p</code>, <code>--protect &lt;RegExp&gt;</code></td><td><code>/pattern/flags</code> for protect</td></tr>
<tr><td><code>-P</code>, <code>--unprotect &lt;RegExp&gt;</code></td><td><code>/pattern/flags</code> for unprotect</td></tr>
<tr><td><code>-e</code>, <code>--encoding &lt;encoding&gt;</code></td><td>encoding method [<code>utf8</code>]</td></tr>
<tr><td><code>-v</code>, <code>--verbose</code></td><td>output I/O information to STDERR</td></tr>
</table>

### input/output

An argument that have no option is considered as input.  
For example:

```shell
htmlclean A.html
```

equals:

```shell
htmlclean -i A.html
```

A `-` is specified as STDIN or STDOUT.

If multiple inputs and outputs are specified, the content from a first input is written to a first output, and the content from a second input is written to a second output..., in this way.  
The all arguments that have no option are added to last of the input list.  
If no inputs are specified, it's considered as one STDIN.  
The outputs exceeding inputs are ignored.  
For example:

```shell
htmlclean -o A.html -o B.html
```

A first input is STDIN, `B.html` is ignored.

If a file is specified to the input of a pair and a directory is specified to the output of this pair, the content is written to the same named file in the specified directory. In this case, if the input path is located under the path that is specified to the `--root` option, the directory tree under the root path is created into the output directory.  
If a file is specified to the input of a pair and the output of this pair isn't specified, the content is written to the file named `<input>.min.<ext>`. For example, if the name of file as input is `index.html`, then the content is written to `index.min.html`.  
If STDIN is specified to the input of a pair and the output of this pair isn't specified (or a directory is specified), the content is written to STDOUT.

The input can be Glob pattern like `*.html`.  
For Glob pattern syntax, see:  
[https://github.com/isaacs/node-glob](#https://github.com/isaacs/node-glob)  
[https://github.com/isaacs/minimatch](#https://github.com/isaacs/minimatch)

If a directory is specified to the input, it is considered as `directory/**/*.html`. And this directory is set to default of the `--root` option.  
If the input of a pair points to multiple files and a directory is specified to the output of this pair, the each content is written to the same named file in the specified directory. In this case, if the input path is located under the path that is specified to the `--root` option, the directory tree under the root path is created into the output directory.  
If the input of a pair points to multiple files and the output of this pair isn't specified, the each content is written to the file named `<input>.min.<ext>`. For example, if the name of file as input is `index.html`, then the content is written to `index.min.html`.  
If the input of a pair points to multiple files and a file (or STDOUT) is specified to the output of this pair, a concatenated content from all input files of this pair is written to the output.

For example:

* Clean `index.html`, and write to `index.min.html`.

```shell
htmlclean index.html
```

* Clean `index.html`, and overwrite it.

```shell
htmlclean index.html -o index.html
```

* Clean all HTML files in `src` directory, and write into `public` directory.

```shell
htmlclean src -o public
```

* Clean `index.html` in `src` directory, and write into `public` directory.

```shell
htmlclean src/index.html -o public
```

* Clean 2 files.

```shell
htmlclean -i A.html -o A.cln.html -i B.html -o B.cln.html
```

* Clean 2 files in `src` directory, and write into `public` directory.

```shell
htmlclean -i src/A.html -o public -i src/B.html -o public
```

* Equal to above.

```shell
htmlclean -i "src/@(A|B).html" -o public
```

* Clean all SVG files.

```shell
htmlclean *.svg
```

* Get and clean web page on URL, and write to `index.html`.

```shell
wget -q -O - https://github.com/ | htmlclean -o index.html
```

* Clean and compress `index.html`, and write to `index.gz`.

```shell
htmlclean index.html -o - | gzip > index.gz
```

* From STDIN to `public/A.html`, from `src/B.html` to STDOUT.

```shell
htmlclean -i - -o public/A.html -i src/B.html -o -
```

* Clean 3 files, and write into 1 file.

```shell
htmlclean -i head.html -i body.html -i foot.html \
-o index.html -o index.html -o index.html
```

* Clean all HTML and SVG and PHP files.

```shell
htmlclean *.{html,svg,php}
```

* Clean all files that has a number as the first character, and extension is `html` or `htm`.

```shell
htmlclean [0-9]*.htm?(l)
```

### protect/unprotect

These must be a text like `/pattern/flags` as RegExp.  
The multiple options can be specified.  
See: [Options](README.md#options)

For example, for some Template Framework and AngularJS.

```shell
htmlclean \
-p "/<\!--%fooTemplate\b.*?%-->/g" \
-p "/<\!--%barTemplate\b.*?%-->/g" \
-P "/<script [^>]*\btype="text\/ng-template"[\s\S]+?<\/script>/ig"
```

### Note

On Windows XP, 2000 + Node v11-, the redirecting doesn't work, the piping works.  
Use:

```shell
type file.html | htmlclean
```

instead of:

```shell
htmlclean < file.html
```
