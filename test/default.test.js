'use strict';

const expect = require('chai').expect,
  htmlclean = require('../lib/htmlclean');

describe('Control flow', () => {

  it('should return empty string when source is not string', () => {
    expect(htmlclean()).to.equal('');
    expect(htmlclean(1)).to.equal('');
    expect(htmlclean(true)).to.equal('');
  });

  it('should throw an error when source contains \\f or \\x07', () => {
    expect(() => { htmlclean('A \f B'); }).to.throw('\\f or \\x07 that is used as marker is included.');
    expect(() => { htmlclean('A \x07 B'); }).to.throw('\\f or \\x07 that is used as marker is included.');
  });

  it('should change the string with options.edit', () => {
    expect(htmlclean('A  B  C  X  Y  Z',
        {edit: src => src.replace(/B C X/, '@')}))
      .to.equal('A @ Y Z');
    expect(htmlclean('A  B  C  X  Y  Z', {edit: () => 1})).to.equal(''); // empty string
    expect(htmlclean('A  B  C  X  Y  Z', {edit: () => false})).to.equal(''); // empty string
  });

  it('should remove invalid markers', () => {
    var html = 'A  B  C  <span attr="  protected   text  "> e1 </span> ' +
      '<textarea>  unprotected  \n\n  text  </textarea> X  Y  Z',
      editHtml;
    // Check normal flow
    expect(htmlclean(html)).to.equal('A B C <span attr="  protected   text  ">e1</span> ' +
      '<textarea>  unprotected  \n\n  text  </textarea> X Y Z'); // textarea is protected
    expect(htmlclean(html, {
      unprotect: /<textarea>[^]*?<\/textarea>/,
      edit: src => (editHtml = src)
    })).to.equal('A B C <span attr="  protected   text  ">e1</span> ' +
      '<textarea>unprotected text</textarea> X Y Z'); // textarea is unprotected
    expect(editHtml).to.equal('A B C <span attr="\f0\x07">e1</span> ' +
      '<textarea>unprotected text</textarea> X Y Z'); // unprotect-marker was already restored

    html = '  A  B  C  <span attr="  protected   text  1  "> e1 </span> ' +
      ' X  Y  Z  <span attr="  protected   text  2  "> e2 </span>   D  E  F  ';
    expect(htmlclean(html, {edit: src => (editHtml = src)}))
      .to.equal('A B C <span attr="  protected   text  1  ">e1</span> ' +
        'X Y Z <span attr="  protected   text  2  ">e2</span> D E F');
    expect(editHtml).to.equal('A B C <span attr="\f0\x07">e1</span> ' +
      'X Y Z <span attr="\f1\x07">e2</span> D E F'); // 2 markers

    // Add markers
    expect(htmlclean(html, {
      edit: src => src +
        ' [add1]\f0\x07[/add1] [add2]\f1\x07[/add2] [add3]\f0\x07[/add3] [add4]\f2\x07[/add4]'
    })).to.equal('A B C <span attr="  protected   text  1  ">e1</span> ' +
      'X Y Z <span attr="  protected   text  2  ">e2</span> D E F' +
      ' [add1]  protected   text  1  [/add1]' +
      ' [add2]  protected   text  2  [/add2]' +
      ' [add3]  protected   text  1  [/add3]' +
      ' [add4][/add4]');
  });

});
