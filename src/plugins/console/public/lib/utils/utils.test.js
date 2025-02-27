/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import * as utils from '.';

describe('Utils class', () => {
  test('extract deprecation messages', function () {
    expect(
      utils.extractWarningMessages(
        '299 Elasticsearch-6.0.0-alpha1-SNAPSHOT-abcdef1 "this is a warning" "Mon, 27 Feb 2017 14:52:14 GMT"'
      )
    ).toEqual(['#! this is a warning']);
    expect(
      utils.extractWarningMessages(
        '299 Elasticsearch-6.0.0-alpha1-SNAPSHOT-abcdef1 "this is a warning"'
      )
    ).toEqual(['#! this is a warning']);

    expect(
      utils.extractWarningMessages(
        '299 Elasticsearch-6.0.0-alpha1-SNAPSHOT-abcdef1 "this is a warning" "Mon, 27 Feb 2017 14:52:14 GMT", 299 Elasticsearch-6.0.0-alpha1-SNAPSHOT-abcdef1 "this is a second warning" "Mon, 27 Feb 2017 14:52:14 GMT"'
      )
    ).toEqual(['#! this is a warning', '#! this is a second warning']);
    expect(
      utils.extractWarningMessages(
        '299 Elasticsearch-6.0.0-alpha1-SNAPSHOT-abcdef1 "this is a warning", 299 Elasticsearch-6.0.0-alpha1-SNAPSHOT-abcdef1 "this is a second warning"'
      )
    ).toEqual(['#! this is a warning', '#! this is a second warning']);

    expect(
      utils.extractWarningMessages(
        '299 Elasticsearch-6.0.0-alpha1-SNAPSHOT-abcdef1 "this is a warning, and it includes a comma" "Mon, 27 Feb 2017 14:52:14 GMT"'
      )
    ).toEqual(['#! this is a warning, and it includes a comma']);
    expect(
      utils.extractWarningMessages(
        '299 Elasticsearch-6.0.0-alpha1-SNAPSHOT-abcdef1 "this is a warning, and it includes a comma"'
      )
    ).toEqual(['#! this is a warning, and it includes a comma']);

    expect(
      utils.extractWarningMessages(
        '299 Elasticsearch-6.0.0-alpha1-SNAPSHOT-abcdef1 "this is a warning, and it includes an escaped backslash \\\\ and a pair of \\"escaped quotes\\"" "Mon, 27 Feb 2017 14:52:14 GMT"'
      )
    ).toEqual([
      '#! this is a warning, and it includes an escaped backslash \\ and a pair of "escaped quotes"',
    ]);
    expect(
      utils.extractWarningMessages(
        '299 Elasticsearch-6.0.0-alpha1-SNAPSHOT-abcdef1 "this is a warning, and it includes an escaped backslash \\\\ and a pair of \\"escaped quotes\\""'
      )
    ).toEqual([
      '#! this is a warning, and it includes an escaped backslash \\ and a pair of "escaped quotes"',
    ]);
  });

  test('unescape', function () {
    expect(utils.unescape('escaped backslash \\\\')).toEqual('escaped backslash \\');
    expect(utils.unescape('a pair of \\"escaped quotes\\"')).toEqual('a pair of "escaped quotes"');
    expect(utils.unescape('escaped quotes do not have to come in pairs: \\"')).toEqual(
      'escaped quotes do not have to come in pairs: "'
    );
  });

  test('split on unquoted comma followed by space', function () {
    expect(utils.splitOnUnquotedCommaSpace('a, b')).toEqual(['a', 'b']);
    expect(utils.splitOnUnquotedCommaSpace('a,b, c')).toEqual(['a,b', 'c']);
    expect(utils.splitOnUnquotedCommaSpace('"a, b"')).toEqual(['"a, b"']);
    expect(utils.splitOnUnquotedCommaSpace('"a, b", c')).toEqual(['"a, b"', 'c']);
    expect(utils.splitOnUnquotedCommaSpace('"a, b\\", c"')).toEqual(['"a, b\\", c"']);
    expect(utils.splitOnUnquotedCommaSpace(', a, b')).toEqual(['', 'a', 'b']);
    expect(utils.splitOnUnquotedCommaSpace('a, b, ')).toEqual(['a', 'b', '']);
    expect(utils.splitOnUnquotedCommaSpace('\\"a, b", "c, d\\", e", f"')).toEqual([
      '\\"a',
      'b", "c',
      'd\\"',
      'e", f"',
    ]);
  });

  describe('formatRequestBodyDoc', function () {
    const tests = [
      {
        source: ['{\n  "test": {}\n}'],
        indent: false,
        assert: ['{"test":{}}'],
      },
      {
        source: ['{"test":{}}'],
        indent: true,
        assert: ['{\n  "test": {}\n}'],
      },
      {
        source: ['{\n  "test": """a\n  b"""\n}'],
        indent: false,
        assert: ['{"test":"a\\n  b"}'],
      },
      {
        source: ['{"test":"a\\n  b"}'],
        indent: true,
        assert: ['{\n  "test": """a\n  b"""\n}'],
      },
    ];

    tests.forEach(({ source, indent, assert }, id) => {
      test(`Test ${id}`, () => {
        const formattedData = utils.formatRequestBodyDoc(source, indent);
        expect(formattedData.data).toEqual(assert);
      });
    });
  });

  describe('hasComments', function () {
    const runCommentTests = (tests) => {
      tests.forEach(({ source, assert }) => {
        test(`\n${source}`, () => {
          const hasComments = utils.hasComments(source);
          expect(hasComments).toEqual(assert);
        });
      });
    };

    describe('match single line comments', () => {
      runCommentTests([
        { source: '{\n  "test": {\n   // "f": {}\n   "a": "b"\n  }\n}', assert: true },
        {
          source: '{\n  "test": {\n   "a": "b",\n   "f": {\n     # "b": {}\n   }\n  }\n}',
          assert: true,
        },
      ]);
    });

    describe('match multiline comments', () => {
      runCommentTests([
        { source: '{\n /* "test": {\n    "a": "b"\n  } */\n}', assert: true },
        {
          source:
            '{\n  "test": {\n    "a": "b",\n   /* "f": {\n      "b": {}\n    } */\n    "c": 1\n  }\n}',
          assert: true,
        },
      ]);
    });

    describe('ignore non-comment tokens', () => {
      runCommentTests([
        { source: '{"test":{"a":"b","f":{"b":{"c":{}}}}}', assert: false },
        {
          source: '{\n  "test": {\n    "a": "b",\n    "f": {\n      "b": {}\n    }\n  }\n}',
          assert: false,
        },
        { source: '{\n  "test": {\n    "f": {}\n  }\n}', assert: false },
      ]);
    });

    describe.skip('ignore comment tokens as values', () => {
      runCommentTests([
        { source: '{\n  "test": {\n    "f": "//"\n  }\n}', assert: false },
        { source: '{\n  "test": {\n    "f": "/* */"\n  }\n}', assert: false },
        { source: '{\n  "test": {\n    "f": "#"\n  }\n}', assert: false },
      ]);
    });

    describe.skip('ignore comment tokens as field names', () => {
      runCommentTests([
        { source: '{\n  "#": {\n    "f": {}\n  }\n}', assert: false },
        { source: '{\n  "//": {\n    "f": {}\n  }\n}', assert: false },
        { source: '{\n  "/* */": {\n    "f": {}\n  }\n}', assert: false },
      ]);
    });
  });

  test('get response with most severe status code', () => {
    expect(
      utils.getResponseWithMostSevereStatusCode([
        { response: { statusCode: 500 } },
        { response: { statusCode: 400 } },
        { response: { statusCode: 200 } },
      ])
    ).toEqual({ response: { statusCode: 500 } });

    expect(
      utils.getResponseWithMostSevereStatusCode([
        { response: { statusCode: 0 } },
        { response: { statusCode: 100 } },
        { response: { statusCode: 201 } },
      ])
    ).toEqual({ response: { statusCode: 201 } });

    expect(utils.getResponseWithMostSevereStatusCode(undefined)).toBe(undefined);
  });
});
