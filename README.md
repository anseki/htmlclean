# htmlclean

* [Grunt](http://gruntjs.com/) plugin: [grunt-htmlclean](https://github.com/anseki/grunt-htmlclean)
* [gulp](http://gulpjs.com/) plugin: [gulp-htmlclean](https://github.com/anseki/gulp-htmlclean)

Simple and safety cleaner without changing the structure to minify HTML/SVG.

## Removing

htmlclean removes the following texts.

+ The leading whitespaces, tabs and line-breaks, and the trailing whitespaces, tabs and line-breaks.
+ The unneeded whitespaces, tabs and line-breaks between HTML/SVG tags.
+ The more than two whitespaces, tabs and line-breaks (suppressed to one space).
+ HTML/SVG comments.
+ The unneeded whitespaces, tabs and line-breaks, meaningless zeros, numbers, signs, etc. in the path data of SVG (e.g. `d` attribute of `path` element).

For example, the more than two whitespaces (even if those are divided by HTML/SVG tags) in a line are suppressed:

* Before

```html
<p>The <strong> clean <span> <em> HTML is here. </em> </span> </strong> </p>
```

* After

```html
<p>The <strong>clean <span><em>HTML is here.</em></span></strong></p>
```

The whitespace that was right side of `<strong>` was removed, and the left side was kept.  
The both side whitespaces of `<em>` were removed.

For example, in a case of this SVG file, 4,784 bytes were reduced:

<img src="Ghostscript_Tiger.svg" width="300" height="300">

## Protecting

The following texts are protected (excluded from [Removing](#removing)).

+ The texts in `textarea`, `script` and `style` elements, and the text nodes in `pre` elements.
+ The quoted texts in the tag attributes.
+ The texts in the SSI tags (PHP, JSP, ASP/ASP.NET and Apache SSI).
+ IE conditional comments. e.g. `<!--[if lt IE 7]>`
+ The texts between `<!--[htmlclean-protect]-->` and `<!--[/htmlclean-protect]-->`.
+ The texts that is matched by the [`protect`](#protect) option.

## Installation

```shell
npm install -g htmlclean
```

## Command Line Tool

```shell
htmlclean [options] [input1 [input2 ...]]
```

Command line tool needs `-g` option when install package.  

See [README-CLI.md](README-CLI.md) for usage.

### Examples

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

* Clean 3 files, and write into 1 file.

```shell
htmlclean -i head.html -i body.html -i foot.html \
-o index.html -o index.html -o index.html
```

### Drag & Drop & Clean

In the GUI environment, drag-and-drop the target file or directory or multiple items to the `htmlclean` icon. Or the short cut (alias, link, etc.) icon on the desktop also works.  
![desktop](gui.png)

The `htmlclean` icon is found in:

```shell
npm bin -g
```

## Node Module

```js
cleanHtml = htmlclean(sourceHtml[, options])
```

`require('htmlclean')` returns a Function. This Function accepts a source HTML, and returns a clean HTML. If you want, you can specify an `options` Object to second argument (see [Options](#options)).

```js
var htmlclean = require('htmlclean');
html = htmlclean(html);

// Or
html = require('htmlclean')(html);
```

### Options

You can specify an `options` Object to second argument. This Object can have following properties.

#### `protect`

Type: RegExp or Array

The texts which are matched to this RegExp are protected in addition to above [Protecting](#protecting) list. The multiple RegExps can be specified via an Array.

#### `unprotect`

Type: RegExp or Array

The texts which are matched to this RegExp are cleaned even if that text is included in above [Protecting](#protecting) list. The multiple RegExps can be specified via an Array.  
For example, a HTML as template in `<script type="text/x-handlebars-template">` is cleaned via following:

```js
html = htmlclean(html, {
  unprotect: /<script [^>]*\btype="text\/x-handlebars-template"[\s\S]+?<\/script>/ig
});
```

The `x-handlebars-template` in a `type` attribute above is case of using the Template Framework [Handlebars](http://handlebarsjs.com/). e.g. [AngularJS](https://angularjs.org/) requires `ng-template` instead of it.

*NOTE:* The RegExp has to match to a text which is not a part of the protected text. For example, the RegExp matches `color: red;` in `<style>` element, but this is not cleaned because all texts in the `<style>` element are protected. `color: red;` is a part of the protected text. The RegExp has to match to a text which is all of `<style>` element like `/<style[\s\S]+?<\/style>/`.

#### `edit`

Type: Function

This Function more edits a HTML.  
The protected texts are hidden from a HTML, and a HTML is passed to this Function. Therefore, this Function doesn't break the protected texts. A HTML which returned from this Function is restored.  
*NOTE:* The markers `\fID\f` (`\f` is "form feed" `\x0C` code, `ID` is number) are inserted to a HTML instead of the protected texts. This Function can remove these markers, but can't add new markers. (Invalid markers will be just removed.)

### Example

See the source HTML file and the result HTML files in the `sample` directory.

```js
var htmlclean = require('htmlclean'),
  fs = require('fs'),
  htmlBefore = fs.readFileSync('./before.html', {encoding: 'utf8'});

var htmlAfter1 = htmlclean(htmlBefore);
fs.writeFileSync('./after1.html', htmlAfter1);

var htmlAfter2 = htmlclean(htmlBefore, {
  protect: /<\!--%fooTemplate\b.*?%-->/g,
  unprotect: /<script [^>]*\btype="text\/x-handlebars-template"[\s\S]+?<\/script>/ig,
  edit: function(html) { return html.replace(/\begg(s?)\b/ig, 'omelet$1'); }
});
fs.writeFileSync('./after2.html', htmlAfter2);
```

## Note

### Malformed Nested Tags, and Close Tags in Script

htmlclean can't parse the malformed nested tags like `<p>foo<pre>bar</p>baz</pre>` precisely. And the close tags in script like `<script>var foo = '</script>';</script>` too. Or, `?>` in PHP code, etc.  
Some language parsers also mistake, then those recommend us to write code like `'<' + '/script>'`. This is better even if htmlclean is not used.

### SSI Tags in HTML Comments

htmlclean removes the HTML/SVG comments that include the SSI tag like `<!-- Info for admin - Foo:<?= expression ?> -->`. I think it's no problem because htmlclean is used to minify HTML. If that SSI tag includes the important code for logic, use a `protect` option, or `<!--[htmlclean-protect]-->` and `<!--[/htmlclean-protect]-->`.

### htmlclean Work

htmlclean never changes the structure of the document even if the elements or attributes look like meaningless, because it might be used by your program, and those are not work htmlclean should do. It should prevent unexpectedly breaking the data after all your efforts.  
If you would like to enforce rules relating to code style, check out the documents such as the code style guide.

## See Also

If you want to control details of editing, [HtmlCompressor](http://code.google.com/p/htmlcompressor/), [HTMLMinifier](https://github.com/kangax/html-minifier) and others are better choice.
