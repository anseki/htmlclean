/*
 * htmlclean
 * https://github.com/anseki/htmlclean
 *
 * <!--[htmlclean-protect]-->This text is protected.<!--[/htmlclean-protect]-->
 *
 * Copyright (c) 2015 anseki
 * Licensed under the MIT license.
 */

'use strict';

/*
  1. Inline elements (HTML 4, XHTML 1.0 Frameset, XHTML 1.1)
  2. Elements in Phrasing content Category(HTML 5, HTML 5.1)
  3. 'SVG.TextContent.class' elements (SVG 1.1 Second Edition)
  empty:      Empty-Element
  altBlock:   Element that keeps inner contents
  embed:      The line-breaks will not be used for margins of this element
*/
var PHRASING_ELEMENTS = {a:{},abbr:{},acronym:{},applet:{altBlock:true,embed:true},b:{},bdo:{},big:{},br:{empty:true},button:{altBlock:true},cite:{},code:{},del:{},dfn:{},em:{},font:{},i:{},iframe:{altBlock:true,embed:true},img:{empty:true},input:{empty:true},ins:{},isindex:{empty:true},kbd:{},label:{},object:{altBlock:true,embed:true},q:{},s:{},samp:{},select:{altBlock:true},small:{},span:{},strike:{},strong:{},sub:{},sup:{},textarea:{},tt:{},u:{},var:{},ruby:{altBlock:true},audio:{altBlock:true,embed:true},bdi:{},canvas:{altBlock:true,embed:true},data:{},embed:{empty:true,embed:true},keygen:{empty:true,embed:true},mark:{},meter:{},output:{},progress:{},time:{},video:{altBlock:true,embed:true},wbr:{empty:true},math:{embed:true},svg:{altBlock:true,embed:true},tspan:{},tref:{},altglyph:{}},
  // attributes of elements using the path data
  PATHDATA = {path:{d:true},animateMotion:{path:true},glyph:{d:true}};

module.exports = function(html, options) {
  var protectedText = [], unprotectedText = [], embedElms,
    htmlWk = '', lastLeadSpace = '', lastTrailSpace = '', lastPhTags = '', lastIsEnd = true,
    // for SVG path
    // http://www.w3.org/TR/SVG11/paths.html#PathDataBNF
    ptnExponent = '[eE][\\+\\-]?\\d+',
    ptnArg = '[\\+\\-]?(?:\\d*\\.\\d+|\\d+\\.?)(?:' + ptnExponent + ')?',
    reCmdLine = new RegExp('[a-z](?:(?:[^\\S\\f]|,)*' + ptnArg + ')*', 'gi'),
    reArgs = new RegExp(ptnArg, 'g'),
    reExponent = new RegExp('(' + ptnExponent + ')$');

  // USAGE: marker = add<ProtectedText|UnprotectedText>(text);
  function addProtectedText(text) {
    if (typeof text !== 'string' || text === '') { return ''; }
    protectedText.push(text);
    return '\f' + (protectedText.length - 1) + '\f';
  }
  function addUnprotectedText(text) {
    if (typeof text !== 'string' || text === '') { return ''; }
    unprotectedText.push(text);
    return '\f!' + (unprotectedText.length - 1) + '\f';
  }

  // Redo String#replace until target is not found
  function replaceComplete(text, re, fnc) {
    var doNext = true, reg = new RegExp(re); // safe (not literal)
    function fncWrap() {
      doNext = true;
      return fnc.apply(null, arguments);
    }
    // This is faster than using RegExp#exec() and RegExp#lastIndex,
    // because replace() isn't called more than twice in almost all cases.
    while (doNext) {
      doNext = false;
      text = text.replace(reg, fncWrap);
    }
    return text;
  }

  if (typeof html !== 'string') { return ''; }
  if (/\f/.test(html)) {
    throw new Error('\\f that is used as marker is included.');
  }

  // unprotected texts
  if (options && options.unprotect) {
    (Array.isArray(options.unprotect) ? options.unprotect : [options.unprotect]).forEach(function(re) {
      if (re instanceof RegExp) {
        html = html.replace(re, function(str) { return addUnprotectedText(str); });
      }
    });
  }

  // [^\S\f] The RegExp pattern except \f from \s

  // <!--[htmlclean-protect]-->
  html = html.replace(/<[^\S\f]*\![^\S\f]*--[^\S\f]*\[[^\S\f]*htmlclean-protect[^\S\f]*\][^\S\f]*--[^\S\f]*>([\s\S]*?)<[^\S\f]*\![^\S\f]*--[^\S\f]*\[[^\S\f]*\/[^\S\f]*htmlclean-protect[^\S\f]*\][^\S\f]*--[^\S\f]*>/ig,
    function(str, p1) { return addProtectedText(p1); });

  /*
    SSI tags
      <% ... %>         PHP, JSP, ASP/ASP.NET
      <?php ... ?>      PHP
      <?php ...         PHP
      <? ... ?>         PHP (confrict <?xml ... ?>)
      <jsp: ... >       JSP
      <asp:...>         ASP/ASP.NET (controls) ** IGNORE **
      <!--# ... -->     Apache SSI
  */
  html = html
    // <?xml ... ?> except xml tag (unprotect)
    .replace(/(<[^\S\f]*\?[^\S\f]*xml\b[^>]*?\?[^\S\f]*>)/ig,
      function(str, p1) { return addUnprotectedText(p1); })
    // <% ... %>, <? ... ?>, <?php ... ?>
    .replace(/(<[^\S\f]*(\%|\?)[\s\S]*?\2[^\S\f]*>)/g, // Not [^>]. '>' may be included.
      function(str, p1) { return addProtectedText(p1); })
    // <?php ...
    .replace(/(<[^\S\f]*\?[^\S\f]*php\b[\s\S]*)/ig,
      function(str, p1) { return addProtectedText(p1); })
    // <jsp: ... >
    .replace(/(<[^\S\f]*jsp[^\S\f]*:[^>]*?>)/ig,
      function(str, p1) { return addProtectedText(p1); })
    // <!--# ... -->
    .replace(/(<[^\S\f]*\![^\S\f]*--[^\S\f]*\#[\s\S]*?--[^\S\f]*>)/g, // Not [^>]. '>' may be included.
      function(str, p1) { return addProtectedText(p1); })
  ;

  // IE conditional comments
  // The line-breaks will not be used for margins of these elements.
  html = html
    /*
      <![if expression]>
      <!--[if expression]>
      <!--[if expression]>-->
      <!--[if expression]><!-->
    */
    .replace(/(?:[\t ]*[\n\r][^\S\f]*)?(<[^\S\f]*\![^\S\f]*(?:--)?[^\S\f]*\[[^\S\f]*if\b[^>]*>(?:(?:<[^\S\f]*\!)?[^\S\f]*--[^\S\f]*>)?)(?:[\t ]*[\n\r][^\S\f]*)?/ig,
      function(str, p1) { return addProtectedText(p1); })
    /*
      <![endif]>
      <![endif]-->
      <!--<![endif]-->
    */
    .replace(/(?:[\t ]*[\n\r][^\S\f]*)?((?:<[^\S\f]*\![^\S\f]*--[^\S\f]*)?<[^\S\f]*\![^\S\f]*\[[^\S\f]*endif\b[^>]*>)(?:[\t ]*[\n\r][^\S\f]*)?/ig,
      function(str, p1) { return addProtectedText(p1); })
  ;

  // HTML elements which include CDATA/preformatted text
  html = html.replace(/(<[^\S\f]*(textarea|script|style|pre)\b[^>]*>)([\s\S]*?)(<[^\S\f]*\/[^\S\f]*\2\b[^>]*>)/ig,
    function(str, startTag, tagName, innerHtml, endTag) {
      var splitHtml;
      if (innerHtml !== '') {
        if (tagName.toLowerCase() === 'pre') { // Allow nesting tags.
          splitHtml = '';
          innerHtml = innerHtml.replace(/([\s\S]*?)(<[^>]+>)/g,
            function(str, text, tag) {
              splitHtml += addProtectedText(text) + tag;
              return '';
            });
          splitHtml += addProtectedText(innerHtml); // Last text.
          return startTag + splitHtml + endTag;
        } else {
          return startTag + addProtectedText(innerHtml) + endTag;
        }
      } else { return startTag + endTag; }
    });

  // Additional protected texts
  if (options && options.protect) {
    (Array.isArray(options.protect) ? options.protect : [options.protect]).forEach(function(re) {
      if (re instanceof RegExp) {
        html = html.replace(re, function(str) { return addProtectedText(str); });
      }
      // Now, ECMAScript doesn't support lookbehind pattern of RegExp. e.g. (?<=...)
      // Alternative solution: Accept { re: /(pre)(needed)/g, capture: 2 }
      // But, ECMAScript doesn't support offset of submatches. (Like Perl @LAST_MATCH_START)
      // Example problem: /(<(div|span)>)(.+?)(<\/\1>)/
      /*
      else if (typeof re === 'object' && re.regexp instanceof RegExp) {
        re.capture = parseInt(re.capture, 10) || 1;
        if (re.capture < 1) { return; } // Invalid parameter
        var capIndex = re.capture - 1; // Capturing position to index of Array
        html = html.replace(re.regexp, function(str) {
          var caps;
          // replace(str, p1, p2, offset, s) capturing parentheses = arguments.length - 3
          if (capIndex > arguments.length - 4) { return str; } // Invalid parameter (Don't change)
          caps = Array.prototype.slice.call(arguments, 1, -2); // To Array
          if (caps[capIndex] === '') { return str; }
          return (capIndex > 0 ? caps.slice(0, capIndex).join('') : '') +
            addProtectedText(caps[capIndex]) +
            (capIndex < caps.length - 1 ? caps.slice(capIndex + 1).join('') : '');
        });
      }
      */
    });
  }

  // Restore unprotected texts
  html = replaceComplete(html, /\f\!(\d+)\f/g,
    function(str, p1) { return unprotectedText[p1] || ''; });

  // HTML comments
  // Texts in CDATA (not HTML) or preformatted are excepted.
  html = html.replace(/<[^\S\f]*\![^\S\f]*--[\s\S]*?--[^\S\f]*>/g, '');

  // Attributes of tags
  html = html.replace(/<([^>]+)>/g,
    function(str, tagInner) {
      var tagName = (tagInner.match(/^[^\S\f]*(?:\/[^\S\f]*)?([^\s\/]+)/) || [])[1];
      return '<' + tagInner.replace(/(?:([^\s\/]+)[^\S\f]*=[^\S\f]*)?("|')([\s\S]*?)\2/g,
        function(str, attrName, quot, innerQuot) {
          return (typeof attrName === 'string' ? attrName + '=' : '') + quot +
            addProtectedText(
              PATHDATA[tagName] && PATHDATA[tagName][attrName] ?
                (function(pathData) { // SVG1.1-SE path data
                  var lastCmd, lastArg = '';
                  return (pathData.match(reCmdLine) || []).reduce(function(cmds, cmdLine) {
                    var cmd = cmdLine.substr(0, 1), args,
                      cmdChr = cmd === lastCmd ||
                        lastCmd === 'm' && cmd === 'l' ||
                        lastCmd === 'M' && cmd === 'L' ? '' : cmd;

                    args = (cmdLine.match(reArgs) || []).reduce(function(args, arg, i) {
                      var exponent = '', separator = '';
                      arg = arg
                        .replace(reExponent, function(s) { exponent = s; return ''; })
                        .replace(/^\+/, '')
                        .replace(/^(\-)?0+/, '$1')      // leading zero
                        .replace(/(\.\d*?)0+$/, '$1')   // trailing zero in fraction
                        .replace(/\.$/, '')             // no fraction
                        .replace(/^\-?$/, '0');

                      if ((cmdChr === '' || i > 0) &&
                          arg.substr(0, 1) !== '-' &&
                          (arg.substr(0, 1) === '.' && !/e|\./i.test(lastArg) ||
                            /^\d/.test(arg))) {
                        separator = ' '; // separator required
                      }

                      exponent = exponent
                        .replace(/^(e)\+/i, '$1')
                        .replace(/^(e\-?)0+/i, '$1')
                        .replace(/^e\-?$/i, '');

                      return args + separator + (lastArg = arg + exponent);
                    }, '');
                    lastCmd = cmd;
                    return cmds + cmdChr + args;
                  }, '');
                })(innerQuot) :
              innerQuot
            ) + quot;
        }) + '>';
    });

  // embed
  embedElms = Object.keys(PHRASING_ELEMENTS)
    .filter(function(tagName) { return PHRASING_ELEMENTS[tagName].embed; }).join('|'); // tagName is safe
  html = html.replace(new RegExp('(?:[\\t ]*[\\n\\r][^\\S\\f]*)?(<[^\\S\\f]*\\/?[^\\S\\f]*(?:' + embedElms + ')\\b[^>]*>)(?:[\\t ]*[\\n\\r][^\\S\\f]*)?', 'ig'), '$1');

    //==================================== MINIFY HTML

    // MINIFY DEFAULT BEHAVIOR
    var minify = true;

    if (options && options.minify !== 'undefined') {
        minify = (typeof options.minify === 'boolean') ? options.minify : minify;
    }

    if (minify) {
        // The [\n\r\t ] may be used for separator of the words or for margins of the elements.
        html = html.replace(/[\n\r\t ]+/g, ' ') // \s includes many others
            .replace(/^ +| +$/g, ''); // Not .trim() that removes \f.

        // Whitespaces in tags
        html = html.replace(/<([^>]+)>/g,
            function(str, tagInner) {
                tagInner = tagInner
                    .replace(/^ +| +$/g, '') // Not .trim() that removes \f.
                    .replace(/(?: *\/ +| +\/ *)/g, '/') // Remove whitespaces in </ p> or <br />
                    .replace(/ *= */g, '=')
                ;
                return '<' + tagInner + '>';
            });

        // Whitespaces between HTML tags
        html = html.replace(/( *)([\s\S]*?)( *)(< *(\/)? *([^ >\/]+)[^>]*>)/g,
            function(str, leadSpace, text, trailSpace, tag, isEnd, tagName) {
                tagName = tagName.toLowerCase();
                if (tagName === 'br' || tagName === 'wbr') {
                    // Break
                    htmlWk += (text ? (lastIsEnd ?
                        lastPhTags + (lastTrailSpace || leadSpace) + text :
                        (lastLeadSpace || leadSpace) + lastPhTags + text) : lastPhTags) +
                        tag;
                    lastLeadSpace = lastTrailSpace = lastPhTags = '';
                    lastIsEnd = true;
                } else if (PHRASING_ELEMENTS[tagName]) {
                    if (PHRASING_ELEMENTS[tagName].altBlock) {
                        // Break
                        if (isEnd) {
                            htmlWk += (text ? (lastIsEnd ?
                                lastPhTags + (lastTrailSpace || leadSpace) + text :
                                (lastLeadSpace || leadSpace) + lastPhTags + text) : lastPhTags) +
                                tag;
                        } else {
                            htmlWk += (lastIsEnd ?
                                lastPhTags + (lastTrailSpace || leadSpace) + text :
                                (lastLeadSpace || leadSpace) + lastPhTags + text) +
                                (text ? trailSpace : '') + tag;
                        }
                        lastLeadSpace = lastTrailSpace = lastPhTags = '';
                        lastIsEnd = true;
                    } else if (PHRASING_ELEMENTS[tagName].empty) {
                        // Break
                        htmlWk += (lastIsEnd ?
                            lastPhTags + (lastTrailSpace || leadSpace) + text :
                            (lastLeadSpace || leadSpace) + lastPhTags + text) +
                            (text ? trailSpace : '') + tag;
                        lastLeadSpace = lastTrailSpace = lastPhTags = '';
                        lastIsEnd = true;
                    } else {
                        if (isEnd) {
                            if (text) {
                                // Break
                                htmlWk += lastIsEnd ?
                                lastPhTags + (lastTrailSpace || leadSpace) + text :
                                (lastLeadSpace || leadSpace) + lastPhTags + text;
                                lastLeadSpace = '';
                                lastTrailSpace = trailSpace;
                                lastPhTags = tag;
                            } else {
                                if (lastIsEnd) {
                                    lastTrailSpace = lastTrailSpace || leadSpace;
                                    lastPhTags += tag;
                                } else {
                                    // Break
                                    htmlWk += lastPhTags;
                                    lastTrailSpace = lastLeadSpace || leadSpace;
                                    lastLeadSpace = '';
                                    lastPhTags = tag;
                                }
                            }
                        } else {
                            if (text) {
                                // Break
                                htmlWk += lastIsEnd ?
                                lastPhTags + (lastTrailSpace || leadSpace) + text :
                                (lastLeadSpace || leadSpace) + lastPhTags + text;
                                lastLeadSpace = trailSpace;
                                lastTrailSpace = '';
                                lastPhTags = tag;
                            } else {
                                if (lastIsEnd) {
                                    // Break
                                    htmlWk += lastPhTags;
                                    lastLeadSpace = lastTrailSpace || leadSpace;
                                    lastTrailSpace = '';
                                    lastPhTags = tag;
                                } else {
                                    lastLeadSpace = lastLeadSpace || leadSpace;
                                    lastPhTags += tag;
                                }
                            }
                        }
                        lastIsEnd = isEnd;
                    }
                } else {
                    // Break
                    htmlWk += (text ? (lastIsEnd ?
                        lastPhTags + (lastTrailSpace || leadSpace) + text :
                        (lastLeadSpace || leadSpace) + lastPhTags + text) : lastPhTags) +
                        tag;
                    lastLeadSpace = lastTrailSpace = lastPhTags = '';
                    lastIsEnd = true;
                }
                return '';
            })
            // Text after last tag (But, it's wrong HTML)
            .replace(/^( *)([\s\S]*)$/,
                function(str, leadSpace, text) {
                    htmlWk += (text ? (lastIsEnd ?
                    lastPhTags + (lastTrailSpace || leadSpace) + text :
                    (lastLeadSpace || leadSpace) + lastPhTags + text) : lastPhTags);
                    return '';
                });
        html = htmlWk;

    } // if (minify)

    // Additional editing
    if (options && typeof options.edit === 'function') {
        html = options.edit(html);
        if (typeof html !== 'string') { html = ''; }
    }

    // Restore [un]protected texts
    html = replaceComplete(html, /\f(\!)?(\d+)\f/g, function(str, p1, p2) { return (p1 ? unprotectedText[p2] : protectedText[p2]) || ''; });

    return html;
};
