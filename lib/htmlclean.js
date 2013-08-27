/*
 * htmlclean
 * https://github.com/anseki/htmlclean
 *
 * <!--[htmlclean-protect]-->This text is protected.<!--[/htmlclean-protect]-->
 *
 * Copyright (c) 2013 anseki
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(html, options) {
  var protectedText = [];
  if (typeof html !== 'string') { return ''; }

  html = html.replace(/\f/g, ' '); // \f is used as marker.

  // <!--[htmlclean-protect]-->
  html = html.replace(/<\!--\[htmlclean-protect\]-->([\s\S]*?)<\!--\[\/htmlclean-protect\]-->/ig, function(str, p1) {
    protectedText.push(p1);
    return '\f' + (protectedText.length - 1) + '\f';
  });

  // Apache SSI tags.
  html = html.replace(/<(\!--\s*\#[\s\S]*?--)>/g, function(str, p1) {
    protectedText.push(p1);
    return '<\f' + (protectedText.length - 1) + '\f>';
  });

  // IE conditional comments.
  html = html.replace(/<(\!(?:--)?\[if [^>]+>[\s\S]*?<\!\[endif\](?:--)?)>/ig, function(str, p1) {
    protectedText.push(p1);
    return '<\f' + (protectedText.length - 1) + '\f>';
  });

  // HTML elements.
  html = html.replace(/(<\s*(textarea|script|style|pre)\b[^>]*>)([\s\S]*?)(<\s*\/\s*\2\b[^>]*>)/ig, function(str, tagOpen, tagName, innerHtml, tagClose) {
    var splitHtml;
    if (innerHtml !== '') {
      if (tagName.toLowerCase === 'pre') { // allow nesting
        splitHtml = '';
        innerHtml = innerHtml.replace(/([\s\S]*?)(<[^>]+>)/g, function(str, p1, p2) {
          if (p1 !== '') {
            protectedText.push(p1);
            splitHtml += '\f' + (protectedText.length - 1) + '\f';
          }
          splitHtml += p2;
          return '';
        });
        if (innerHtml !== '') {
          protectedText.push(innerHtml);
          splitHtml += '\f' + (protectedText.length - 1) + '\f';
        }
        return tagOpen + splitHtml + tagClose;
      } else {
        protectedText.push(innerHtml);
        return tagOpen + '\f' + (protectedText.length - 1) + '\f' + tagClose;
      }
    } else { return tagOpen + tagClose; }
  });

  // Additional protected texts.
  if (options && options.protect) {
    (Array.isArray(options.protect) ? options.protect : [options.protect]).forEach(function(re) {
      if (re instanceof RegExp) {
        html = html.replace(re, function(str) {
          protectedText.push(str);
          return '\f' + (protectedText.length - 1) + '\f';
        });
      }
      // Now, ECMAScript doesn't support lookbehind pattern of regular expression.
      // Alternative solution: Accept { re: /(pre)(needed)/g, capture: 2 }
      // But, ECMAScript doesn't support offset of submatches. (Like Perl @LAST_MATCH_START)
      // Example problem: /(<(div|span)>)(.+?)(<\/\2>)/
      /*
      else if (typeof re === 'object' && re.regexp instanceof RegExp) {
        re.capture = parseInt(re.capture, 10) || 1;
        if (re.capture < 1) { return; } // Invalid parameter.
        var capIndex = re.capture - 1; // Capturing position to index of Array.
        html = html.replace(re.regexp, function(str) {
          var caps;
          // replace(str, p1, p2, offset, s) capturing parentheses = arguments.length - 3
          if (capIndex > arguments.length - 4) { return str; } // Invalid parameter. (Don't change)
          caps = Array.prototype.slice.call(arguments, 1, -2); // To Array
          if (caps[capIndex] === '') { return str; }
          protectedText.push(caps[capIndex]);
          return (capIndex > 0 ? caps.slice(0, capIndex).join('') : '') +
            '\f' + (protectedText.length - 1) + '\f' +
            (capIndex < caps.length - 1 ? caps.slice(capIndex + 1).join('') : '');
        });
      }
      */
    });
  }

  // Attributes, Comments
  html = html.replace(/<([^>]+)>/g, function(str, tagInner) {
    if (/^\!--[\s\S]*--$/.test(tagInner)) {
      return '';
    } else {
      tagInner = tagInner.replace(/("|')([\s\S]*?)\1/g, function(str, quot, innerQuot) {
        if (innerQuot !== '') {
          protectedText.push(innerQuot);
          return quot + '\f' + (protectedText.length - 1) + '\f' + quot;
        } else { return quot + quot; }
      });
      return '<' + tagInner + '>';
    }
  });

  html = html.replace(/^\s+/, '');
  html = html.replace(/\s+$/, '');
  // Except space. e.g. <div><span>NAME</span> <span>VALUE</span></div>
  html = html.replace(/>[\n\r\t]+</g, '><');
  html = html.replace(/[\n\r \t]+/g, ' ');

  // Additional editing.
  if (options && typeof options.edit === 'function') {
    html = options.edit(html);
    if (typeof html !== 'string') { html = ''; }
  }

  // Restore protected texts.
  html = html.replace(/\f(\d+)\f/g, function(str, p1) { return protectedText[p1] || ''; });

  return html;
};
