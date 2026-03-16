var Module = typeof Module != "undefined" ? Module : {};
var ENVIRONMENT_IS_WEB = !!globalThis.window;
var ENVIRONMENT_IS_WORKER = !!globalThis.WorkerGlobalScope;
var ENVIRONMENT_IS_NODE =
  globalThis.process?.versions?.node && globalThis.process?.type != "renderer";
var arguments_ = [];
var thisProgram = "./this.program";
var quit_ = (status, toThrow) => {
  throw toThrow;
};
var _scriptName = globalThis.document?.currentScript?.src;
if (typeof __filename != "undefined") {
  _scriptName = __filename;
} else if (ENVIRONMENT_IS_WORKER) {
  _scriptName = self.location.href;
}
var scriptDirectory = "";
var readAsync, readBinary;
if (ENVIRONMENT_IS_NODE) {
  var fs = require("node:fs");
  scriptDirectory = __dirname + "/";
  readBinary = (filename) => {
    filename = isFileURI(filename) ? new URL(filename) : filename;
    var ret = fs.readFileSync(filename);
    return ret;
  };
  readAsync = async (filename, binary = true) => {
    filename = isFileURI(filename) ? new URL(filename) : filename;
    var ret = fs.readFileSync(filename, binary ? undefined : "utf8");
    return ret;
  };
  if (process.argv.length > 1) {
    thisProgram = process.argv[1].replace(/\\/g, "/");
  }
  arguments_ = process.argv.slice(2);
  if (typeof module != "undefined") {
    module["exports"] = Module;
  }
  quit_ = (status, toThrow) => {
    process.exitCode = status;
    throw toThrow;
  };
} else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  try {
    scriptDirectory = new URL(".", _scriptName).href;
  } catch {}
  {
    if (ENVIRONMENT_IS_WORKER) {
      readBinary = (url) => {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, false);
        xhr.responseType = "arraybuffer";
        xhr.send(null);
        return new Uint8Array(xhr.response);
      };
    }
    readAsync = async (url) => {
      if (isFileURI(url)) {
        return new Promise((resolve, reject) => {
          var xhr = new XMLHttpRequest();
          xhr.open("GET", url, true);
          xhr.responseType = "arraybuffer";
          xhr.onload = () => {
            if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) {
              resolve(xhr.response);
              return;
            }
            reject(xhr.status);
          };
          xhr.onerror = reject;
          xhr.send(null);
        });
      }
      var response = await fetch(url, { credentials: "same-origin" });
      if (response.ok) {
        return response.arrayBuffer();
      }
      throw new Error(response.status + " : " + response.url);
    };
  }
} else {
}
var out = console.log.bind(console);
var err = console.error.bind(console);
var wasmBinary;
var WebAssembly = {
  Memory: function (opts) {
    this.buffer = new ArrayBuffer(opts["initial"] * 65536);
  },
  Module: function (binary) {},
  Instance: function (module, info) {
    this.exports = // EMSCRIPTEN_START_ASM
    (function instantiate(xa) {
      var a;
      var b = new Uint8Array(123);
      for (var c = 25; c >= 0; --c) {
        b[48 + c] = 52 + c;
        b[65 + c] = c;
        b[97 + c] = 26 + c;
      }
      b[43] = 62;
      b[47] = 63;
      function i(j, k, l) {
        var d,
          e,
          c = 0,
          f = k,
          g = l.length,
          h = k + ((g * 3) >> 2) - (l[g - 2] == "=") - (l[g - 1] == "=");
        for (; c < g; c += 4) {
          d = b[l.charCodeAt(c + 1)];
          e = b[l.charCodeAt(c + 2)];
          j[f++] = (b[l.charCodeAt(c)] << 2) | (d >> 4);
          if (f < h) j[f++] = (d << 4) | (e >> 2);
          if (f < h) j[f++] = (e << 6) | b[l.charCodeAt(c + 3)];
        }
        return j;
      }
      function m(n) {
        i(
          a,
          1028,
          "KAQAAAIAAAADAAAABAAAAAUAAAAGAAAABwAAAAgAAAAJAAAAND0AADQEAABsBAAATjEwR2FtZVNvbHZlcjhDb25uZWN0NDE4VHJhbnNwb3NpdGlvblRhYmxlSWp5aExpMjRFRUUAAAAMPQAAdAQAAE4xMEdhbWVTb2x2ZXI4Q29ubmVjdDQxMVRhYmxlR2V0dGVySXloRUUAMDEyMzQ1Njc4OWFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6AGluZmluaXR5AEZlYnJ1YXJ5AEphbnVhcnkASnVseQBUaHVyc2RheQBUdWVzZGF5AFdlZG5lc2RheQBTYXR1cmRheQBTdW5kYXkATW9uZGF5AEZyaWRheQBNYXkAJW0vJWQvJXkAd3gAd2J4AHcrYngAbmVnYW1heAAtKyAgIDBYMHgALTBYKzBYIDBYLTB4KzB4IDB4AHcreAB3AE5vdgBUaHUAdW5zdXBwb3J0ZWQgbG9jYWxlIGZvciBzdGFuZGFyZCBpbnB1dABBdWd1c3QAT2N0AFNhdABwb3NzaWJsZU5vbkxvc2luZ01vdmVzACBieXRlcwAlczolZDogJXMAQXByAHZlY3RvcgBtb25leV9nZXQgZXJyb3IAT2N0b2JlcgBOb3ZlbWJlcgBTZXB0ZW1iZXIARGVjZW1iZXIATWFyAG5hdGl2ZS9Qb3NpdGlvbi5ocHAAbmF0aXZlL1NvbHZlci5jcHAAL2Vtc2RrL2Vtc2NyaXB0ZW4vc3lzdGVtL2xpYi9saWJjeHhhYmkvc3JjL3ByaXZhdGVfdHlwZWluZm8uY3BwAFNlcAAlSTolTTolUyAlcABTdW4ASnVuAE1vbgBuYW4ASmFuAEp1bABBcHJpbABGcmkAYmFkX2FycmF5X25ld19sZW5ndGgATWFyY2gAQXVnAGluZgAwMTIzNDU2Nzg5YWJjZGVmACUuMExmACVMZgB0cnVlAFR1ZQBmYWxzZQBKdW5lACUwKmxsZAAlKmxsZAArJWxsZAAlKy40bGQAbG9jYWxlIG5vdCBzdXBwb3J0ZWQAV2VkACVZLSVtLSVkAERlYwB3YgByYgBGZWIAYWIAdytiAHIrYgBhK2IAcndhAGFscGhhIDwgYmV0YQAlYSAlYiAlZCAlSDolTTolUyAlWQBQT1NJWAAlSDolTTolUwBOQU4AUE0AQU0AJUg6JU0ATENfQUxMAEFTQ0lJAExBTkcASU5GAEMAY2F0Y2hpbmcgYSBjbGFzcyB3aXRob3V0IGFuIG9iamVjdD8AMDEyMzQ1Njc4OQBDLlVURi04ADAxMjM0NTY3ADAxAC4ALQB3KwByKwBhKwAobnVsbCkAIVAuY2FuV2luTmV4dCgpACFjYW5XaW5OZXh0KCkAJQBJbnZhbGlkIGludGVybmFsIGtleSBzaXplOiAAVW5pbXBsZW1lbnRlZCBPcGVuaW5nQm9vayBzaXplOiAACgAJAAAAAAAAAIgIAAAKAAAACwAAAAwAAAANAAAADgAAAA8AAAAQAAAAEQAAADQ9AACUCAAAbAQAAE4xMEdhbWVTb2x2ZXI4Q29ubmVjdDQxOFRyYW5zcG9zaXRpb25UYWJsZUloeWhMaTIxRUVFAAAAAAAAAPQIAAASAAAAEwAAABQAAAAVAAAAFgAAABcAAAAYAAAAGQAAADQ9AAAACQAAbAQAAE4xMEdhbWVTb2x2ZXI4Q29ubmVjdDQxOFRyYW5zcG9zaXRpb25UYWJsZUloeWhMaTIyRUVFAAAAAAAAAGAJAAAaAAAAGwAAABwAAAAdAAAAHgAAAB8AAAAgAAAAIQAAADQ9AABsCQAAbAQAAE4xMEdhbWVTb2x2ZXI4Q29ubmVjdDQxOFRyYW5zcG9zaXRpb25UYWJsZUloeWhMaTIzRUVFAAAAAAAAAMwJAAAiAAAAIwAAACQAAAAlAAAAJgAAACcAAAAoAAAAKQAAADQ9AADYCQAAbAQAAE4xMEdhbWVTb2x2ZXI4Q29ubmVjdDQxOFRyYW5zcG9zaXRpb25UYWJsZUloeWhMaTI0RUVFAAAAAAAAADgKAAAqAAAAKwAAACwAAAAtAAAALgAAAC8AAAAwAAAAMQAAADQ9AABECgAAbAQAAE4xMEdhbWVTb2x2ZXI4Q29ubmVjdDQxOFRyYW5zcG9zaXRpb25UYWJsZUloeWhMaTI1RUVFAAAAAAAAAKQKAAAyAAAAMwAAADQAAAA1AAAANgAAADcAAAA4AAAAOQAAADQ9AACwCgAAbAQAAE4xMEdhbWVTb2x2ZXI4Q29ubmVjdDQxOFRyYW5zcG9zaXRpb25UYWJsZUloeWhMaTI2RUVFAAAAAAAAABALAAA6AAAAOwAAADwAAAA9AAAAPgAAAD8AAABAAAAAQQAAADQ9AAAcCwAAbAQAAE4xMEdhbWVTb2x2ZXI4Q29ubmVjdDQxOFRyYW5zcG9zaXRpb25UYWJsZUloeWhMaTI3RUVFAAAAAAAAAHwLAABCAAAAQwAAAEQAAABFAAAARgAAAEcAAABIAAAASQAAADQ9AACICwAAbAQAAE4xMEdhbWVTb2x2ZXI4Q29ubmVjdDQxOFRyYW5zcG9zaXRpb25UYWJsZUl0eWhMaTIxRUVFAAAAAAAAAOgLAABKAAAASwAAAEwAAABNAAAATgAAAE8AAABQAAAAUQAAADQ9AAD0CwAAbAQAAE4xMEdhbWVTb2x2ZXI4Q29ubmVjdDQxOFRyYW5zcG9zaXRpb25UYWJsZUl0eWhMaTIyRUVFAAAAAAAAAFQMAABSAAAAUwAAAFQAAABVAAAAVgAAAFcAAABYAAAAWQAAADQ9AABgDAAAbAQAAE4xMEdhbWVTb2x2ZXI4Q29ubmVjdDQxOFRyYW5zcG9zaXRpb25UYWJsZUl0eWhMaTIzRUVFAAAAAAAAAMAMAABaAAAAWwAAAFwAAABdAAAAXgAAAF8AAABgAAAAYQAAADQ9AADMDAAAbAQAAE4xMEdhbWVTb2x2ZXI4Q29ubmVjdDQxOFRyYW5zcG9zaXRpb25UYWJsZUl0eWhMaTI0RUVFAAAAAAAAACwNAABiAAAAYwAAAGQAAABlAAAAZgAAAGcAAABoAAAAaQAAADQ9AAA4DQAAbAQAAE4xMEdhbWVTb2x2ZXI4Q29ubmVjdDQxOFRyYW5zcG9zaXRpb25UYWJsZUl0eWhMaTI1RUVFAAAAAAAAAJgNAABqAAAAawAAAGwAAABtAAAAbgAAAG8AAABwAAAAcQAAADQ9AACkDQAAbAQAAE4xMEdhbWVTb2x2ZXI4Q29ubmVjdDQxOFRyYW5zcG9zaXRpb25UYWJsZUl0eWhMaTI2RUVFAAAAAAAAAAQOAAByAAAAcwAAAHQAAAB1AAAAdgAAAHcAAAB4AAAAeQAAADQ9AAAQDgAAbAQAAE4xMEdhbWVTb2x2ZXI4Q29ubmVjdDQxOFRyYW5zcG9zaXRpb25UYWJsZUl0eWhMaTI3RUVFAAAAAAAAAHAOAAB6AAAAewAAAHwAAAB9AAAAfgAAAH8AAACAAAAAgQAAADQ9AAB8DgAAbAQAAE4xMEdhbWVTb2x2ZXI4Q29ubmVjdDQxOFRyYW5zcG9zaXRpb25UYWJsZUlqeWhMaTIxRUVFAAAAAAAAANwOAACCAAAAgwAAAIQAAACFAAAAhgAAAIcAAACIAAAAiQAAADQ9AADoDgAAbAQAAE4xMEdhbWVTb2x2ZXI4Q29ubmVjdDQxOFRyYW5zcG9zaXRpb25UYWJsZUlqeWhMaTIyRUVFAAAAAAAAAEgPAACKAAAAiwAAAIwAAACNAAAAjgAAAI8AAACQAAAAkQAAADQ9AABUDwAAbAQAAE4xMEdhbWVTb2x2ZXI4Q29ubmVjdDQxOFRyYW5zcG9zaXRpb25UYWJsZUlqeWhMaTIzRUVFAAAAAAAAALQPAACSAAAAkwAAAJQAAACVAAAAlgAAAJcAAACYAAAAmQAAADQ9AADADwAAbAQAAE4xMEdhbWVTb2x2ZXI4Q29ubmVjdDQxOFRyYW5zcG9zaXRpb25UYWJsZUlqeWhMaTI1RUVFAAAAAAAAACAQAACaAAAAmwAAAJwAAACdAAAAngAAAJ8AAACgAAAAoQAAADQ9AAAsEAAAbAQAAE4xMEdhbWVTb2x2ZXI4Q29ubmVjdDQxOFRyYW5zcG9zaXRpb25UYWJsZUlqeWhMaTI2RUVFAAAAAAAAAIwQAACiAAAAowAAAKQAAAClAAAApgAAAKcAAACoAAAAqQAAADQ9AACYEAAAbAQAAE4xMEdhbWVTb2x2ZXI4Q29ubmVjdDQxOFRyYW5zcG9zaXRpb25UYWJsZUlqeWhMaTI3RUVFAAAAAAAAAGgSAACwAAAAsQAAALIAAACzAAAAtAAAALUAAAC2AAAAtwAAALgAAAC5AAAAugAAALsAAAC8AAAAvQAAAAgAAAAAAAAApBIAAL4AAAC/AAAA+P////j///+kEgAAwAAAAMEAAAAEAAAAAAAAAOwSAADCAAAAwwAAAPz////8////7BIAAMQAAADFAAAAAAAAAGwTAADGAAAAxwAAAMgAAADJAAAAygAAAMsAAADMAAAAzQAAAM4AAADPAAAA0AAAANEAAADSAAAA0wAAAAgAAAAAAAAAqBMAANQAAADVAAAA+P////j///+oEwAA1gAAANcAAAAEAAAAAAAAAPATAADYAAAA2QAAAPz////8////8BMAANoAAADbAAAAAAAAANQUAADcAAAA3QAAAN4AAADfAAAA4AAAAOEAAADiAAAAtwAAALgAAADjAAAAugAAAOQAAAC8AAAA5QAAADQ9AAA8EgAAIBUAAE5TdDNfXzI5YmFzaWNfaW9zSWNOU18xMWNoYXJfdHJhaXRzSWNFRUVFAAAADD0AAHASAABOU3QzX18yMTViYXNpY19zdHJlYW1idWZJY05TXzExY2hhcl90cmFpdHNJY0VFRUUAAAAAkD0AALwSAAAAAAAAAQAAADASAAAD9P//TlN0M19fMjEzYmFzaWNfaXN0cmVhbUljTlNfMTFjaGFyX3RyYWl0c0ljRUVFRQAAkD0AAAQTAAAAAAAAAQAAADASAAAD9P//TlN0M19fMjEzYmFzaWNfb3N0cmVhbUljTlNfMTFjaGFyX3RyYWl0c0ljRUVFRQAAND0AAEATAAAgFQAATlN0M19fMjliYXNpY19pb3NJd05TXzExY2hhcl90cmFpdHNJd0VFRUUAAAAMPQAAdBMAAE5TdDNfXzIxNWJhc2ljX3N0cmVhbWJ1Zkl3TlNfMTFjaGFyX3RyYWl0c0l3RUVFRQAAAACQPQAAwBMAAAAAAAABAAAANBMAAAP0//9OU3QzX18yMTNiYXNpY19pc3RyZWFtSXdOU18xMWNoYXJfdHJhaXRzSXdFRUVFAACQPQAACBQAAAAAAAABAAAANBMAAAP0//9OU3QzX18yMTNiYXNpY19vc3RyZWFtSXdOU18xMWNoYXJfdHJhaXRzSXdFRUVFAABsAAAAAAAAAJgUAADmAAAA5wAAAJT///+U////mBQAAOgAAADpAAAARBQAAHwUAACQFAAAWBQAAGwAAAAAAAAApBIAAL4AAAC/AAAAlP///5T///+kEgAAwAAAAMEAAAA0PQAApBQAAKQSAABOU3QzX18yMTRiYXNpY19pZnN0cmVhbUljTlNfMTFjaGFyX3RyYWl0c0ljRUVFRQA0PQAA4BQAAGgSAABOU3QzX18yMTNiYXNpY19maWxlYnVmSWNOU18xMWNoYXJfdHJhaXRzSWNFRUVFAAAAAAAAIBUAAOoAAADrAAAADD0AACgVAABOU3QzX18yOGlvc19iYXNlRQAAANg+AABoPwAAAEA=",
        );
        i(a, 5456, "3hIElQAAAAD///////////////9QFQAAFAAAAEMuVVRGLTg=");
        i(a, 5536, "ZBU=");
        i(
          a,
          5568,
          "AgAAwAMAAMAEAADABQAAwAYAAMAHAADACAAAwAkAAMAKAADACwAAwAwAAMANAADADgAAwA8AAMAQAADAEQAAwBIAAMATAADAFAAAwBUAAMAWAADAFwAAwBgAAMAZAADAGgAAwBsAAMAcAADAHQAAwB4AAMAfAADAAAAAswEAAMMCAADDAwAAwwQAAMMFAADDBgAAwwcAAMMIAADDCQAAwwoAAMMLAADDDAAAww0AANMOAADDDwAAwwAADLsBAAzDAgAMwwMADMMEAAzbAAAAAMwWAACwAAAA7wAAAPAAAACzAAAAtAAAALUAAAC2AAAAtwAAALgAAADxAAAA8gAAAPMAAAC8AAAAvQAAADQ9AADYFgAAaBIAAE5TdDNfXzIxMF9fc3RkaW5idWZJY0VFAAAAAAAwFwAAsAAAAPQAAAD1AAAAswAAALQAAAC1AAAA9gAAALcAAAC4AAAAuQAAALoAAAC7AAAA9wAAAPgAAAA0PQAAPBcAAGgSAABOU3QzX18yMTFfX3N0ZG91dGJ1ZkljRUUAAAAAAAAAAJgXAADGAAAA+QAAAPoAAADJAAAAygAAAMsAAADMAAAAzQAAAM4AAAD7AAAA/AAAAP0AAADSAAAA0wAAADQ9AACkFwAAbBMAAE5TdDNfXzIxMF9fc3RkaW5idWZJd0VFAAAAAAD8FwAAxgAAAP4AAAD/AAAAyQAAAMoAAADLAAAAAAEAAM0AAADOAAAAzwAAANAAAADRAAAAAQEAAAIBAAA0PQAACBgAAGwTAABOU3QzX18yMTFfX3N0ZG91dGJ1Zkl3RUU=",
        );
        i(
          a,
          6192,
          "TENfQ1RZUEUAAAAATENfTlVNRVJJQwAATENfVElNRQAAAAAATENfQ09MTEFURQAATENfTU9ORVRBUlkATENfTUVTU0FHRVM=",
        );
        i(
          a,
          6276,
          "gN4oAIDITQAAp3YAADSeAIASxwCAn+4AAH4XAYBcQAGA6WcBAMiQAQBVuAEZAAsAGRkZAAAAAAUAAAAAAAAJAAAAAAsAAAAAAAAAABkACgoZGRkDCgcAAQAJCxgAAAkGCwAACwAGGQAAABkZGQ==",
        );
        i(a, 6401, "DgAAAAAAAAAAGQALDRkZGQANAAACAAkOAAAACQAOAAAO");
        i(a, 6459, "DA==");
        i(a, 6471, "EwAAAAATAAAAAAkMAAAAAAAMAAAM");
        i(a, 6517, "EA==");
        i(a, 6529, "DwAAAAQPAAAAAAkQAAAAAAAQAAAQ");
        i(a, 6575, "Eg==");
        i(a, 6587, "EQAAAAARAAAAAAkSAAAAAAASAAASAAAaAAAAGhoa");
        i(a, 6642, "GgAAABoaGgAAAAAAAAk=");
        i(a, 6691, "FA==");
        i(a, 6703, "FwAAAAAXAAAAAAkUAAAAAAAUAAAU");
        i(a, 6749, "Fg==");
        i(a, 6761, "FQAAAAAVAAAAAAkWAAAAAAAWAAAWAAAwMTIzNDU2Nzg5QUJDREVGLg==");
        i(
          a,
          6816,
          "U3VuAE1vbgBUdWUAV2VkAFRodQBGcmkAU2F0AFN1bmRheQBNb25kYXkAVHVlc2RheQBXZWRuZXNkYXkAVGh1cnNkYXkARnJpZGF5AFNhdHVyZGF5AEphbgBGZWIATWFyAEFwcgBNYXkASnVuAEp1bABBdWcAU2VwAE9jdABOb3YARGVjAEphbnVhcnkARmVicnVhcnkATWFyY2gAQXByaWwATWF5AEp1bmUASnVseQBBdWd1c3QAU2VwdGVtYmVyAE9jdG9iZXIATm92ZW1iZXIARGVjZW1iZXIAQU0AUE0AJWEgJWIgJWUgJVQgJVkAJW0vJWQvJXkAJUg6JU06JVMAJUk6JU06JVMgJXAAAAAlbS8lZC8leQAwMTIzNDU2Nzg5ACVhICViICVlICVUICVZACVIOiVNOiVTAAAAAABeW3lZXQBeW25OXQB5ZXMAbm8=",
        );
        i(
          a,
          7168,
          "0XSeAFedvSqAcFIP//8+JwoAAABkAAAA6AMAABAnAACghgEAQEIPAICWmAAA4fUFGAAAADUAAABxAAAAa////877//+Sv///AAAAAAAAAAD/////////////////////////////////////////////////////////////////AAECAwQFBgcICf////////8KCwwNDg8QERITFBUWFxgZGhscHR4fICEiI////////woLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIj/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////wABAgQHAwYFAAAAAAAAADAxMjM0NTY3ODlhYmNkZWZBQkNERUZ4WCstcFBpSW5OACVJOiVNOiVTICVwJUg6JU0=",
        );
        i(
          a,
          7584,
          "JQAAAG0AAAAvAAAAJQAAAGQAAAAvAAAAJQAAAHkAAAAlAAAAWQAAAC0AAAAlAAAAbQAAAC0AAAAlAAAAZAAAACUAAABJAAAAOgAAACUAAABNAAAAOgAAACUAAABTAAAAIAAAACUAAABwAAAAAAAAACUAAABIAAAAOgAAACUAAABN",
        );
        i(
          a,
          7728,
          "JQAAAEgAAAA6AAAAJQAAAE0AAAA6AAAAJQAAAFMAAAAAAAAAkCcAABgBAAAZAQAAGgEAAAAAAAD0JwAAGwEAABwBAAAaAQAAHQEAAB4BAAAfAQAAIAEAACEBAAAiAQAAIwEAACQB",
        );
        i(
          a,
          7840,
          "BAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABQIAAAUAAAAFAAAABQAAAAUAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAADAgAAggAAAIIAAACCAAAAggAAAIIAAACCAAAAggAAAIIAAACCAAAAggAAAIIAAACCAAAAggAAAIIAAACCAAAAQgEAAEIBAABCAQAAQgEAAEIBAABCAQAAQgEAAEIBAABCAQAAQgEAAIIAAACCAAAAggAAAIIAAACCAAAAggAAAIIAAAAqAQAAKgEAACoBAAAqAQAAKgEAACoBAAAqAAAAKgAAACoAAAAqAAAAKgAAACoAAAAqAAAAKgAAACoAAAAqAAAAKgAAACoAAAAqAAAAKgAAACoAAAAqAAAAKgAAACoAAAAqAAAAKgAAAIIAAACCAAAAggAAAIIAAACCAAAAggAAADIBAAAyAQAAMgEAADIBAAAyAQAAMgEAADIAAAAyAAAAMgAAADIAAAAyAAAAMgAAADIAAAAyAAAAMgAAADIAAAAyAAAAMgAAADIAAAAyAAAAMgAAADIAAAAyAAAAMgAAADIAAAAyAAAAggAAAIIAAACCAAAAggAAAAQ=",
        );
        i(
          a,
          8868,
          "TCcAACUBAAAmAQAAGgEAACcBAAAoAQAAKQEAACoBAAArAQAALAEAAC0BAAAAAAAAKCgAAC4BAAAvAQAAGgEAADABAAAxAQAAMgEAADMBAAA0AQAAAAAAAEwoAAA1AQAANgEAABoBAAA3AQAAOAEAADkBAAA6AQAAOwEAAHQAAAByAAAAdQAAAGUAAAAAAAAAZgAAAGEAAABsAAAAcwAAAGUAAAAAAAAAJQAAAG0AAAAvAAAAJQAAAGQAAAAvAAAAJQAAAHkAAAAAAAAAJQAAAEgAAAA6AAAAJQAAAE0AAAA6AAAAJQAAAFMAAAAAAAAAJQAAAGEAAAAgAAAAJQAAAGIAAAAgAAAAJQAAAGQAAAAgAAAAJQAAAEgAAAA6AAAAJQAAAE0AAAA6AAAAJQAAAFMAAAAgAAAAJQAAAFkAAAAAAAAAJQAAAEkAAAA6AAAAJQAAAE0AAAA6AAAAJQAAAFMAAAAgAAAAJQAAAHA=",
        );
        i(
          a,
          9244,
          "LCQAADwBAAA9AQAAGgEAADQ9AAA4JAAAgDwAAE5TdDNfXzI2bG9jYWxlNWZhY2V0RQAAAAAAAACUJAAAPAEAAD4BAAAaAQAAPwEAAEABAABBAQAAQgEAAEMBAABEAQAARQEAAEYBAABHAQAASAEAAEkBAABKAQAAkD0AALQkAAAAAAAAAgAAACwkAAACAAAAyCQAAAIAAABOU3QzX18yNWN0eXBlSXdFRQAAAAw9AADQJAAATlN0M19fMjEwY3R5cGVfYmFzZUUAAAAAAAAAABglAAA8AQAASwEAABoBAABMAQAATQEAAE4BAABPAQAAUAEAAFEBAABSAQAAkD0AADglAAAAAAAAAgAAACwkAAACAAAAXCUAAAIAAABOU3QzX18yN2NvZGVjdnRJY2MxMV9fbWJzdGF0ZV90RUUAAAAMPQAAZCUAAE5TdDNfXzIxMmNvZGVjdnRfYmFzZUUAAAAAAACsJQAAPAEAAFMBAAAaAQAAVAEAAFUBAABWAQAAVwEAAFgBAABZAQAAWgEAAJA9AADMJQAAAAAAAAIAAAAsJAAAAgAAAFwlAAACAAAATlN0M19fMjdjb2RlY3Z0SURzYzExX19tYnN0YXRlX3RFRQAAAAAAACAmAAA8AQAAWwEAABoBAABcAQAAXQEAAF4BAABfAQAAYAEAAGEBAABiAQAAkD0AAEAmAAAAAAAAAgAAACwkAAACAAAAXCUAAAIAAABOU3QzX18yN2NvZGVjdnRJRHNEdTExX19tYnN0YXRlX3RFRQAAAAAAlCYAADwBAABjAQAAGgEAAGQBAABlAQAAZgEAAGcBAABoAQAAaQEAAGoBAACQPQAAtCYAAAAAAAACAAAALCQAAAIAAABcJQAAAgAAAE5TdDNfXzI3Y29kZWN2dElEaWMxMV9fbWJzdGF0ZV90RUUAAAAAAAAIJwAAPAEAAGsBAAAaAQAAbAEAAG0BAABuAQAAbwEAAHABAABxAQAAcgEAAJA9AAAoJwAAAAAAAAIAAAAsJAAAAgAAAFwlAAACAAAATlN0M19fMjdjb2RlY3Z0SURpRHUxMV9fbWJzdGF0ZV90RUUAkD0AAGwnAAAAAAAAAgAAACwkAAACAAAAXCUAAAIAAABOU3QzX18yN2NvZGVjdnRJd2MxMV9fbWJzdGF0ZV90RUUAAAA0PQAAnCcAACwkAABOU3QzX18yNmxvY2FsZTVfX2ltcEUAAAA0PQAAwCcAACwkAABOU3QzX18yN2NvbGxhdGVJY0VFADQ9AADgJwAALCQAAE5TdDNfXzI3Y29sbGF0ZUl3RUUAkD0AABQoAAAAAAAAAgAAACwkAAACAAAAyCQAAAIAAABOU3QzX18yNWN0eXBlSWNFRQAAADQ9AAA0KAAALCQAAE5TdDNfXzI4bnVtcHVuY3RJY0VFAAAAADQ9AABYKAAALCQAAE5TdDNfXzI4bnVtcHVuY3RJd0VFAAAAAAAAAAC0JwAAcwEAAHQBAAAaAQAAdQEAAHYBAAB3AQAAAAAAANQnAAB4AQAAeQEAABoBAAB6AQAAewEAAHwBAAAAAAAA8CgAADwBAAB9AQAAGgEAAH4BAAB/AQAAgAEAAIEBAACCAQAAgwEAAIQBAACFAQAAhgEAAIcBAACIAQAAkD0AABApAAAAAAAAAgAAACwkAAACAAAAVCkAAAAAAABOU3QzX18yN251bV9nZXRJY05TXzE5aXN0cmVhbWJ1Zl9pdGVyYXRvckljTlNfMTFjaGFyX3RyYWl0c0ljRUVFRUVFAJA9AABsKQAAAAAAAAEAAACEKQAAAAAAAE5TdDNfXzI5X19udW1fZ2V0SWNFRQAAAAw9AACMKQAATlN0M19fMjE0X19udW1fZ2V0X2Jhc2VFAAAAAAAAAADoKQAAPAEAAIkBAAAaAQAAigEAAIsBAACMAQAAjQEAAI4BAACPAQAAkAEAAJEBAACSAQAAkwEAAJQBAACQPQAACCoAAAAAAAACAAAALCQAAAIAAABMKgAAAAAAAE5TdDNfXzI3bnVtX2dldEl3TlNfMTlpc3RyZWFtYnVmX2l0ZXJhdG9ySXdOU18xMWNoYXJfdHJhaXRzSXdFRUVFRUUAkD0AAGQqAAAAAAAAAQAAAIQpAAAAAAAATlN0M19fMjlfX251bV9nZXRJd0VFAAAAAAAAALAqAAA8AQAAlQEAABoBAACWAQAAlwEAAJgBAACZAQAAmgEAAJsBAACcAQAAnQEAAJA9AADQKgAAAAAAAAIAAAAsJAAAAgAAABQrAAAAAAAATlN0M19fMjdudW1fcHV0SWNOU18xOW9zdHJlYW1idWZfaXRlcmF0b3JJY05TXzExY2hhcl90cmFpdHNJY0VFRUVFRQCQPQAALCsAAAAAAAABAAAARCsAAAAAAABOU3QzX18yOV9fbnVtX3B1dEljRUUAAAAMPQAATCsAAE5TdDNfXzIxNF9fbnVtX3B1dF9iYXNlRQAAAAAAAAAAnCsAADwBAACeAQAAGgEAAJ8BAACgAQAAoQEAAKIBAACjAQAApAEAAKUBAACmAQAAkD0AALwrAAAAAAAAAgAAACwkAAACAAAAACwAAAAAAABOU3QzX18yN251bV9wdXRJd05TXzE5b3N0cmVhbWJ1Zl9pdGVyYXRvckl3TlNfMTFjaGFyX3RyYWl0c0l3RUVFRUVFAJA9AAAYLAAAAAAAAAEAAABEKwAAAAAAAE5TdDNfXzI5X19udW1fcHV0SXdFRQAAAAAAAACELAAApwEAAKgBAAAaAQAAqQEAAKoBAACrAQAArAEAAK0BAACuAQAArwEAAPj///+ELAAAsAEAALEBAACyAQAAswEAALQBAAC1AQAAtgEAAJA9AACsLAAAAAAAAAMAAAAsJAAAAgAAAPQsAAACAAAAEC0AAAAIAABOU3QzX18yOHRpbWVfZ2V0SWNOU18xOWlzdHJlYW1idWZfaXRlcmF0b3JJY05TXzExY2hhcl90cmFpdHNJY0VFRUVFRQAAAAAMPQAA/CwAAE5TdDNfXzI5dGltZV9iYXNlRQAADD0AABgtAABOU3QzX18yMjBfX3RpbWVfZ2V0X2Nfc3RvcmFnZUljRUUAAAAAAAAAkC0AALcBAAC4AQAAGgEAALkBAAC6AQAAuwEAALwBAAC9AQAAvgEAAL8BAAD4////kC0AAMABAADBAQAAwgEAAMMBAADEAQAAxQEAAMYBAACQPQAAuC0AAAAAAAADAAAALCQAAAIAAAD0LAAAAgAAAAAuAAAACAAATlN0M19fMjh0aW1lX2dldEl3TlNfMTlpc3RyZWFtYnVmX2l0ZXJhdG9ySXdOU18xMWNoYXJfdHJhaXRzSXdFRUVFRUUAAAAADD0AAAguAABOU3QzX18yMjBfX3RpbWVfZ2V0X2Nfc3RvcmFnZUl3RUUAAAAAAAAARC4AAMcBAADIAQAAGgEAAMkBAACQPQAAZC4AAAAAAAACAAAALCQAAAIAAACsLgAAAAgAAE5TdDNfXzI4dGltZV9wdXRJY05TXzE5b3N0cmVhbWJ1Zl9pdGVyYXRvckljTlNfMTFjaGFyX3RyYWl0c0ljRUVFRUVFAAAAAAw9AAC0LgAATlN0M19fMjEwX190aW1lX3B1dEUAAAAAAAAAAOQuAADKAQAAywEAABoBAADMAQAAkD0AAAQvAAAAAAAAAgAAACwkAAACAAAArC4AAAAIAABOU3QzX18yOHRpbWVfcHV0SXdOU18xOW9zdHJlYW1idWZfaXRlcmF0b3JJd05TXzExY2hhcl90cmFpdHNJd0VFRUVFRQAAAAAAAAAAhC8AADwBAADNAQAAGgEAAM4BAADPAQAA0AEAANEBAADSAQAA0wEAANQBAADVAQAA1gEAAJA9AACkLwAAAAAAAAIAAAAsJAAAAgAAAMAvAAACAAAATlN0M19fMjEwbW9uZXlwdW5jdEljTGIwRUVFAAw9AADILwAATlN0M19fMjEwbW9uZXlfYmFzZUUAAAAAAAAAABgwAAA8AQAA1wEAABoBAADYAQAA2QEAANoBAADbAQAA3AEAAN0BAADeAQAA3wEAAOABAACQPQAAODAAAAAAAAACAAAALCQAAAIAAADALwAAAgAAAE5TdDNfXzIxMG1vbmV5cHVuY3RJY0xiMUVFRQAAAAAAjDAAADwBAADhAQAAGgEAAOIBAADjAQAA5AEAAOUBAADmAQAA5wEAAOgBAADpAQAA6gEAAJA9AACsMAAAAAAAAAIAAAAsJAAAAgAAAMAvAAACAAAATlN0M19fMjEwbW9uZXlwdW5jdEl3TGIwRUVFAAAAAAAAMQAAPAEAAOsBAAAaAQAA7AEAAO0BAADuAQAA7wEAAPABAADxAQAA8gEAAPMBAAD0AQAAkD0AACAxAAAAAAAAAgAAACwkAAACAAAAwC8AAAIAAABOU3QzX18yMTBtb25leXB1bmN0SXdMYjFFRUUAAAAAAFgxAAA8AQAA9QEAABoBAAD2AQAA9wEAAJA9AAB4MQAAAAAAAAIAAAAsJAAAAgAAAMAxAAAAAAAATlN0M19fMjltb25leV9nZXRJY05TXzE5aXN0cmVhbWJ1Zl9pdGVyYXRvckljTlNfMTFjaGFyX3RyYWl0c0ljRUVFRUVFAAAADD0AAMgxAABOU3QzX18yMTFfX21vbmV5X2dldEljRUU=",
        );
        i(
          a,
          12777,
          "MgAAPAEAAPgBAAAaAQAA+QEAAPoBAACQPQAAIDIAAAAAAAACAAAALCQAAAIAAABoMgAAAAAAAE5TdDNfXzI5bW9uZXlfZ2V0SXdOU18xOWlzdHJlYW1idWZfaXRlcmF0b3JJd05TXzExY2hhcl90cmFpdHNJd0VFRUVFRQAAAAw9AABwMgAATlN0M19fMjExX19tb25leV9nZXRJd0VFAAAAAAAAAACoMgAAPAEAAPsBAAAaAQAA/AEAAP0BAACQPQAAyDIAAAAAAAACAAAALCQAAAIAAAAQMwAAAAAAAE5TdDNfXzI5bW9uZXlfcHV0SWNOU18xOW9zdHJlYW1idWZfaXRlcmF0b3JJY05TXzExY2hhcl90cmFpdHNJY0VFRUVFRQAAAAw9AAAYMwAATlN0M19fMjExX19tb25leV9wdXRJY0VFAAAAAAAAAABQMwAAPAEAAP4BAAAaAQAA/wEAAAACAACQPQAAcDMAAAAAAAACAAAALCQAAAIAAAC4MwAAAAAAAE5TdDNfXzI5bW9uZXlfcHV0SXdOU18xOW9zdHJlYW1idWZfaXRlcmF0b3JJd05TXzExY2hhcl90cmFpdHNJd0VFRUVFRQAAAAw9AADAMwAATlN0M19fMjExX19tb25leV9wdXRJd0VFAAAAAAAAAAD8MwAAPAEAAAECAAAaAQAAAgIAAAMCAAAEAgAAkD0AABw0AAAAAAAAAgAAACwkAAACAAAANDQAAAIAAABOU3QzX18yOG1lc3NhZ2VzSWNFRQAAAAAMPQAAPDQAAE5TdDNfXzIxM21lc3NhZ2VzX2Jhc2VFAAAAAAB0NAAAPAEAAAUCAAAaAQAABgIAAAcCAAAIAgAAkD0AAJQ0AAAAAAAAAgAAACwkAAACAAAANDQAAAIAAABOU3QzX18yOG1lc3NhZ2VzSXdFRQAAAABTAAAAdQAAAG4AAABkAAAAYQAAAHkAAAAAAAAATQAAAG8AAABuAAAAZAAAAGEAAAB5AAAAAAAAAFQAAAB1AAAAZQAAAHMAAABkAAAAYQAAAHkAAAAAAAAAVwAAAGUAAABkAAAAbgAAAGUAAABzAAAAZAAAAGEAAAB5AAAAAAAAAFQAAABoAAAAdQAAAHIAAABzAAAAZAAAAGEAAAB5AAAAAAAAAEYAAAByAAAAaQAAAGQAAABhAAAAeQAAAAAAAABTAAAAYQAAAHQAAAB1AAAAcgAAAGQAAABhAAAAeQAAAAAAAABTAAAAdQAAAG4AAAAAAAAATQAAAG8AAABuAAAAAAAAAFQAAAB1AAAAZQAAAAAAAABXAAAAZQAAAGQAAAAAAAAAVAAAAGgAAAB1AAAAAAAAAEYAAAByAAAAaQAAAAAAAABTAAAAYQAAAHQAAAAAAAAASgAAAGEAAABuAAAAdQAAAGEAAAByAAAAeQAAAAAAAABGAAAAZQAAAGIAAAByAAAAdQAAAGEAAAByAAAAeQAAAAAAAABNAAAAYQAAAHIAAABjAAAAaAAAAAAAAABBAAAAcAAAAHIAAABpAAAAbAAAAAAAAABNAAAAYQAAAHkAAAAAAAAASgAAAHUAAABuAAAAZQAAAAAAAABKAAAAdQAAAGwAAAB5AAAAAAAAAEEAAAB1AAAAZwAAAHUAAABzAAAAdAAAAAAAAABTAAAAZQAAAHAAAAB0AAAAZQAAAG0AAABiAAAAZQAAAHIAAAAAAAAATwAAAGMAAAB0AAAAbwAAAGIAAABlAAAAcgAAAAAAAABOAAAAbwAAAHYAAABlAAAAbQAAAGIAAABlAAAAcgAAAAAAAABEAAAAZQAAAGMAAABlAAAAbQAAAGIAAABlAAAAcgAAAAAAAABKAAAAYQAAAG4AAAAAAAAARgAAAGUAAABiAAAAAAAAAE0AAABhAAAAcgAAAAAAAABBAAAAcAAAAHIAAAAAAAAASgAAAHUAAABuAAAAAAAAAEoAAAB1AAAAbAAAAAAAAABBAAAAdQAAAGcAAAAAAAAAUwAAAGUAAABwAAAAAAAAAE8AAABjAAAAdAAAAAAAAABOAAAAbwAAAHYAAAAAAAAARAAAAGUAAABjAAAAAAAAAEEAAABNAAAAAAAAAFAAAABN",
        );
        i(
          a,
          14372,
          "CgAAAGQAAADoAwAAECcAAKCGAQBAQg8AgJaYAADh9QUAypo7AAAAAAAAAAAwMDAxMDIwMzA0MDUwNjA3MDgwOTEwMTExMjEzMTQxNTE2MTcxODE5MjAyMTIyMjMyNDI1MjYyNzI4MjkzMDMxMzIzMzM0MzUzNjM3MzgzOTQwNDE0MjQzNDQ0NTQ2NDc0ODQ5NTA1MTUyNTM1NDU1NTY1NzU4NTk2MDYxNjI2MzY0NjU2NjY3Njg2OTcwNzE3MjczNzQ3NTc2Nzc3ODc5ODA4MTgyODM4NDg1ODY4Nzg4ODk5MDkxOTI5Mzk0OTU5Njk3OTg5OQAAAAAAAAAAMDAwMDAwMDEwMDEwMDAxMTAxMDAwMTAxMDExMDAxMTExMDAwMTAwMTEwMTAxMDExMTEwMDExMDExMTEwMTExMTAwMDEwMjAzMDQwNTA2MDcxMDExMTIxMzE0MTUxNjE3MjAyMTIyMjMyNDI1MjYyNzMwMzEzMjMzMzQzNTM2Mzc0MDQxNDI0MzQ0NDU0NjQ3NTA1MTUyNTM1NDU1NTY1NzYwNjE2MjYzNjQ2NTY2Njc3MDcxNzI3Mzc0NzU3Njc3MDAwMTAyMDMwNDA1MDYwNzA4MDkwYTBiMGMwZDBlMGYxMDExMTIxMzE0MTUxNjE3MTgxOTFhMWIxYzFkMWUxZjIwMjEyMjIzMjQyNTI2MjcyODI5MmEyYjJjMmQyZTJmMzAzMTMyMzMzNDM1MzYzNzM4MzkzYTNiM2MzZDNlM2Y0MDQxNDI0MzQ0NDU0NjQ3NDg0OTRhNGI0YzRkNGU0ZjUwNTE1MjUzNTQ1NTU2NTc1ODU5NWE1YjVjNWQ1ZTVmNjA2MTYyNjM2NDY1NjY2NzY4Njk2YTZiNmM2ZDZlNmY3MDcxNzI3Mzc0NzU3Njc3Nzg3OTdhN2I3YzdkN2U3ZjgwODE4MjgzODQ4NTg2ODc4ODg5OGE4YjhjOGQ4ZThmOTA5MTkyOTM5NDk1OTY5Nzk4OTk5YTliOWM5ZDllOWZhMGExYTJhM2E0YTVhNmE3YThhOWFhYWJhY2FkYWVhZmIwYjFiMmIzYjRiNWI2YjdiOGI5YmFiYmJjYmRiZWJmYzBjMWMyYzNjNGM1YzZjN2M4YzljYWNiY2NjZGNlY2ZkMGQxZDJkM2Q0ZDVkNmQ3ZDhkOWRhZGJkY2RkZGVkZmUwZTFlMmUzZTRlNWU2ZTdlOGU5ZWFlYmVjZWRlZWVmZjBmMWYyZjNmNGY1ZjZmN2Y4ZjlmYWZiZmNmZGZlZmYAAAAAAAAAAAoAAAAAAAAAZAAAAAAAAADoAwAAAAAAABAnAAAAAAAAoIYBAAAAAABAQg8AAAAAAICWmAAAAAAAAOH1BQAAAAAAypo7AAAAAADkC1QCAAAAAOh2SBcAAAAAEKXU6AAAAACgck4YCQAAAEB6EPNaAAAAgMakfo0DAAAAwW/yhiMAAACKXXhFYwEAAGSns7bgDQAA6IkEI8eKDD0AAIg8AABOU3QzX18yMTRfX3NoYXJlZF9jb3VudEUAAAAAND0AALA8AAC4PgAATjEwX19jeHhhYml2MTE2X19zaGltX3R5cGVfaW5mb0UAAAAAND0AAOA8AACkPAAATjEwX19jeHhhYml2MTE3X19jbGFzc190eXBlX2luZm9FAAAAAAAAANQ8AAAJAgAACgIAAAsCAAAMAgAADQIAAA4CAAAPAgAAEAIAAAAAAABUPQAACQIAABECAAALAgAADAIAAA0CAAASAgAAEwIAABQCAAA0PQAAYD0AANQ8AABOMTBfX2N4eGFiaXYxMjBfX3NpX2NsYXNzX3R5cGVfaW5mb0UAAAAAAAAAALA9AAAJAgAAFQIAAAsCAAAMAgAADQIAABYCAAAXAgAAGAIAADQ9AAC8PQAA1DwAAE4xMF9fY3h4YWJpdjEyMV9fdm1pX2NsYXNzX3R5cGVfaW5mb0UAAAAAAAAALD4AAKsAAAAZAgAAGgIAAAw9AAAAPgAAU3Q5ZXhjZXB0aW9uAAAAADQ9AAAcPgAA+D0AAFN0OWJhZF9hbGxvYwAAAAA0PQAAOD4AABA+AABTdDIwYmFkX2FycmF5X25ld19sZW5ndGgAAAAAAAAAAGg+AACqAAAAGwIAABwCAAA0PQAAdD4AAPg9AABTdDExbG9naWNfZXJyb3IAAAAAAJg+AACqAAAAHQIAABwCAAA0PQAApD4AAGg+AABTdDEybGVuZ3RoX2Vycm9yAAAAAAw9AADAPgAAU3Q5dHlwZV9pbmZv",
        );
        i(a, 16080, "wFgBAAAAAAAJ");
        i(a, 16100, "rw==");
        i(a, 16120, "rgAAAAAAAACsAAAAOEMAAAAE");
        i(a, 16164, "/////w==");
        i(a, 16232, "BQ==");
        i(a, 16244, "7A==");
        i(a, 16268, "rQAAAO0AAABIRwAAAAQ=");
        i(a, 16292, "AQ==");
        i(a, 16308, "/////wo=");
        i(a, 16376, "aD8AAAAAAAAF");
        i(a, 16396, "rw==");
        i(a, 16420, "rQAAAKwAAABQSw==");
        i(a, 16444, "Ag==");
        i(a, 16460, "//////////8=");
        i(a, 16529, "QAAAACAAACVtLyVkLyV5AAAACCVIOiVNOiVTAAAACA==");
      }
      var o = new ArrayBuffer(16);
      var p = new Int32Array(o);
      var q = new Float32Array(o);
      var r = new Float64Array(o);
      function s(t) {
        return p[t];
      }
      function u(t, v) {
        p[t] = v;
      }
      function w() {
        return r[0];
      }
      function x(v) {
        r[0] = v;
      }
      function y() {
        throw new Error("abort");
      }
      function z(A, B, C) {
        a.copyWithin(A, B, B + C);
      }
      function D(A, v, C) {
        A = A >>> 0;
        C = C >>> 0;
        if (A + C > a.length) throw "trap: invalid memory.fill";
        a.fill(v, A, A + C);
      }
      function E() {
        return q[2];
      }
      function F(v) {
        q[2] = v;
      }
      function wa(n) {
        var G = new ArrayBuffer(209715200);
        var H = new Int8Array(G);
        var I = new Int16Array(G);
        var J = new Int32Array(G);
        var K = new Uint8Array(G);
        var L = new Uint16Array(G);
        var M = new Uint32Array(G);
        var N = new Float32Array(G);
        var O = new Float64Array(G);
        var P = Math.imul;
        var Q = Math.fround;
        var R = Math.abs;
        var S = Math.clz32;
        var T = Math.min;
        var U = Math.max;
        var V = Math.floor;
        var W = Math.ceil;
        var X = Math.trunc;
        var Y = Math.sqrt;
        var Z = n.a;
        var _ = Z.a;
        var $ = Z.b;
        var aa = Z.c;
        var ba = Z.d;
        var ca = Z.e;
        var da = Z.f;
        var ea = Z.g;
        var fa = Z.h;
        var ga = Z.i;
        var ha = Z.j;
        var ia = Z.k;
        var ja = Z.l;
        var ka = 88256;
        var la = 0;
        var ma = 0;
        var na = 0;
        // EMSCRIPTEN_START_FUNCS
        function af(a, b, c, d) {
          var e = 0,
            f = 0,
            g = 0,
            h = 0,
            i = 0,
            j = 0,
            k = 0,
            l = 0,
            m = 0,
            n = 0,
            o = 0,
            p = 0,
            q = 0,
            r = 0,
            t = 0,
            v = 0,
            y = 0,
            z = 0,
            A = 0,
            B = 0,
            C = 0,
            D = 0,
            E = 0,
            G = 0,
            I = 0,
            L = 0,
            N = 0;
          p = (ka - 48) | 0;
          ka = p;
          a: {
            b: {
              if (c >>> 0 > 2) {
                break b;
              }
              c = c << 2;
              L = J[(c + 7228) >> 2];
              G = J[(c + 7216) >> 2];
              while (1) {
                c = J[(b + 4) >> 2];
                c: {
                  if ((c | 0) != J[(b + 104) >> 2]) {
                    J[(b + 4) >> 2] = c + 1;
                    c = K[c | 0];
                    break c;
                  }
                  c = Ca(b);
                }
                if (yb(c)) {
                  continue;
                }
                break;
              }
              t = 1;
              d: {
                e: {
                  switch ((c - 43) | 0) {
                    case 0:
                    case 2:
                      break e;
                    default:
                      break d;
                  }
                }
                t = (c | 0) == 45 ? -1 : 1;
                c = J[(b + 4) >> 2];
                if ((c | 0) != J[(b + 104) >> 2]) {
                  J[(b + 4) >> 2] = c + 1;
                  c = K[c | 0];
                  break d;
                }
                c = Ca(b);
              }
              f: {
                g: {
                  if ((c & -33) == 73) {
                    while (1) {
                      if ((g | 0) == 7) {
                        break g;
                      }
                      c = J[(b + 4) >> 2];
                      h: {
                        if ((c | 0) != J[(b + 104) >> 2]) {
                          J[(b + 4) >> 2] = c + 1;
                          c = K[c | 0];
                          break h;
                        }
                        c = Ca(b);
                      }
                      r = H[(g + 1219) | 0];
                      g = (g + 1) | 0;
                      if ((c | 32) == (r | 0)) {
                        continue;
                      }
                      break;
                    }
                  }
                  if ((g | 0) != 3) {
                    r = (g | 0) == 8;
                    if (r) {
                      break g;
                    }
                    if (!d | (g >>> 0 < 4)) {
                      break f;
                    }
                    if (r) {
                      break g;
                    }
                  }
                  c = J[(b + 116) >> 2];
                  if (((c | 0) >= 0) | ((c | 0) > 0)) {
                    J[(b + 4) >> 2] = J[(b + 4) >> 2] - 1;
                  }
                  if (!d | (g >>> 0 < 4)) {
                    break g;
                  }
                  c = (c | 0) < 0;
                  while (1) {
                    if (!c) {
                      J[(b + 4) >> 2] = J[(b + 4) >> 2] - 1;
                    }
                    g = (g - 1) | 0;
                    if (g >>> 0 > 3) {
                      continue;
                    }
                    break;
                  }
                }
                q = (ka - 16) | 0;
                ka = q;
                d = (F(Q(Q(t | 0) * Q(Infinity))), s(2));
                g = d & 8388607;
                c = (d >>> 23) | 0;
                b = c & 255;
                i: {
                  if (b) {
                    if ((b | 0) != 255) {
                      h = g << 25;
                      f = (g >>> 7) | 0;
                      b = ((c & 255) + 16256) | 0;
                      break i;
                    }
                    h = g << 25;
                    f = (g >>> 7) | 0;
                    b = 32767;
                    break i;
                  }
                  b = 0;
                  if (!g) {
                    break i;
                  }
                  b = S(g);
                  Ta(q, g, 0, 0, 0, (b + 81) | 0);
                  h = J[(q + 8) >> 2];
                  f = J[(q + 12) >> 2] ^ 65536;
                  i = J[q >> 2];
                  j = J[(q + 4) >> 2];
                  b = (16265 - b) | 0;
                }
                J[p >> 2] = i;
                J[(p + 4) >> 2] = j;
                J[(p + 8) >> 2] = h;
                J[(p + 12) >> 2] = f | ((d & -2147483648) | (b << 16));
                ka = (q + 16) | 0;
                h = J[(p + 8) >> 2];
                f = J[(p + 12) >> 2];
                i = J[p >> 2];
                j = J[(p + 4) >> 2];
                break a;
              }
              j: {
                k: {
                  l: {
                    m: {
                      n: {
                        o: {
                          if (g) {
                            break o;
                          }
                          g = 0;
                          if ((c & -33) != 78) {
                            break o;
                          }
                          while (1) {
                            if ((g | 0) == 2) {
                              break n;
                            }
                            c = J[(b + 4) >> 2];
                            p: {
                              if ((c | 0) != J[(b + 104) >> 2]) {
                                J[(b + 4) >> 2] = c + 1;
                                c = K[c | 0];
                                break p;
                              }
                              c = Ca(b);
                            }
                            r = H[(g + 1673) | 0];
                            g = (g + 1) | 0;
                            if ((c | 32) == (r | 0)) {
                              continue;
                            }
                            break;
                          }
                        }
                        switch (g | 0) {
                          case 3:
                            break n;
                          case 0:
                            break k;
                          default:
                            break m;
                        }
                      }
                      q: {
                        c = J[(b + 4) >> 2];
                        r: {
                          if ((c | 0) != J[(b + 104) >> 2]) {
                            J[(b + 4) >> 2] = c + 1;
                            c = K[c | 0];
                            break r;
                          }
                          c = Ca(b);
                        }
                        if ((c | 0) == 40) {
                          g = 1;
                          break q;
                        }
                        f = 2147450880;
                        if (J[(b + 116) >> 2] < 0) {
                          break a;
                        }
                        J[(b + 4) >> 2] = J[(b + 4) >> 2] - 1;
                        break a;
                      }
                      while (1) {
                        c = J[(b + 4) >> 2];
                        s: {
                          if ((c | 0) != J[(b + 104) >> 2]) {
                            J[(b + 4) >> 2] = c + 1;
                            c = K[c | 0];
                            break s;
                          }
                          c = Ca(b);
                        }
                        if (
                          !(
                            !(
                              ((c - 48) >>> 0 < 10) |
                              ((c - 65) >>> 0 < 26) |
                              ((c | 0) == 95)
                            ) &
                            ((c - 97) >>> 0 >= 26)
                          )
                        ) {
                          g = (g + 1) | 0;
                          continue;
                        }
                        break;
                      }
                      f = 2147450880;
                      if ((c | 0) == 41) {
                        break a;
                      }
                      c = J[(b + 116) >> 2];
                      if (((c | 0) >= 0) | ((c | 0) > 0)) {
                        J[(b + 4) >> 2] = J[(b + 4) >> 2] - 1;
                      }
                      t: {
                        if (d) {
                          if (g) {
                            break t;
                          }
                          break j;
                        }
                        break l;
                      }
                      while (1) {
                        if (((c | 0) > 0) | ((c | 0) >= 0)) {
                          J[(b + 4) >> 2] = J[(b + 4) >> 2] - 1;
                        }
                        g = (g - 1) | 0;
                        if (g) {
                          continue;
                        }
                        break;
                      }
                      break j;
                    }
                    c = J[(b + 116) >> 2];
                    if ((c | 0) > 0) {
                      c = 1;
                    } else {
                      c = (c | 0) >= 0;
                    }
                    if (c) {
                      J[(b + 4) >> 2] = J[(b + 4) >> 2] - 1;
                    }
                  }
                  J[4158] = 28;
                  hb(b, 0, 0);
                  break b;
                }
                u: {
                  if ((c | 0) != 48) {
                    break u;
                  }
                  g = J[(b + 4) >> 2];
                  v: {
                    if ((g | 0) != J[(b + 104) >> 2]) {
                      J[(b + 4) >> 2] = g + 1;
                      g = K[g | 0];
                      break v;
                    }
                    g = Ca(b);
                  }
                  if ((g & -33) == 88) {
                    e = (ka - 432) | 0;
                    ka = e;
                    c = J[(b + 4) >> 2];
                    w: {
                      if ((c | 0) != J[(b + 104) >> 2]) {
                        J[(b + 4) >> 2] = c + 1;
                        c = K[c | 0];
                        break w;
                      }
                      c = Ca(b);
                    }
                    x: {
                      y: {
                        while (1) {
                          if ((c | 0) != 48) {
                            z: {
                              if ((c | 0) != 46) {
                                break x;
                              }
                              c = J[(b + 4) >> 2];
                              if ((c | 0) == J[(b + 104) >> 2]) {
                                break z;
                              }
                              J[(b + 4) >> 2] = c + 1;
                              c = K[c | 0];
                              break y;
                            }
                          } else {
                            c = J[(b + 4) >> 2];
                            if ((c | 0) != J[(b + 104) >> 2]) {
                              I = 1;
                              J[(b + 4) >> 2] = c + 1;
                              c = K[c | 0];
                            } else {
                              I = 1;
                              c = Ca(b);
                            }
                            continue;
                          }
                          break;
                        }
                        c = Ca(b);
                      }
                      if ((c | 0) != 48) {
                        C = 1;
                        break x;
                      }
                      while (1) {
                        c = q;
                        q = (c - 1) | 0;
                        v = (v - !c) | 0;
                        c = J[(b + 4) >> 2];
                        A: {
                          if ((c | 0) != J[(b + 104) >> 2]) {
                            J[(b + 4) >> 2] = c + 1;
                            c = K[c | 0];
                            break A;
                          }
                          c = Ca(b);
                        }
                        if ((c | 0) == 48) {
                          continue;
                        }
                        break;
                      }
                      C = 1;
                      I = 1;
                    }
                    j = 1073676288;
                    while (1) {
                      B: {
                        C: {
                          D: {
                            g = c;
                            k = (c - 48) | 0;
                            if (k >>> 0 < 10) {
                              break D;
                            }
                            r = (c | 0) != 46;
                            g = c | 32;
                            if (r & ((g - 97) >>> 0 > 5)) {
                              break B;
                            }
                            if (r) {
                              break D;
                            }
                            if (C) {
                              break B;
                            }
                            C = 1;
                            q = h;
                            v = f;
                            break C;
                          }
                          c = (c | 0) > 57 ? (g - 87) | 0 : k;
                          E: {
                            if (
                              (((f | 0) <= 0) & (h >>> 0 <= 7)) |
                              ((f | 0) < 0)
                            ) {
                              n = (c + (n << 4)) | 0;
                              break E;
                            }
                            if (!f & (h >>> 0 <= 28)) {
                              Za((e + 48) | 0, c);
                              Fa((e + 32) | 0, D, E, i, j, 0, 0, 0, 1073414144);
                              D = J[(e + 32) >> 2];
                              E = J[(e + 36) >> 2];
                              i = J[(e + 40) >> 2];
                              j = J[(e + 44) >> 2];
                              Fa(
                                (e + 16) | 0,
                                J[(e + 48) >> 2],
                                J[(e + 52) >> 2],
                                J[(e + 56) >> 2],
                                J[(e + 60) >> 2],
                                D,
                                E,
                                i,
                                j,
                              );
                              Ya(
                                e,
                                J[(e + 16) >> 2],
                                J[(e + 20) >> 2],
                                J[(e + 24) >> 2],
                                J[(e + 28) >> 2],
                                l,
                                m,
                                A,
                                B,
                              );
                              A = J[(e + 8) >> 2];
                              B = J[(e + 12) >> 2];
                              l = J[e >> 2];
                              m = J[(e + 4) >> 2];
                              break E;
                            }
                            if (!c | o) {
                              break E;
                            }
                            Fa((e + 80) | 0, D, E, i, j, 0, 0, 0, 1073610752);
                            Ya(
                              (e - -64) | 0,
                              J[(e + 80) >> 2],
                              J[(e + 84) >> 2],
                              J[(e + 88) >> 2],
                              J[(e + 92) >> 2],
                              l,
                              m,
                              A,
                              B,
                            );
                            o = 1;
                            A = J[(e + 72) >> 2];
                            B = J[(e + 76) >> 2];
                            l = J[(e + 64) >> 2];
                            m = J[(e + 68) >> 2];
                          }
                          h = (h + 1) | 0;
                          f = h ? f : (f + 1) | 0;
                          I = 1;
                        }
                        c = J[(b + 4) >> 2];
                        if ((c | 0) != J[(b + 104) >> 2]) {
                          J[(b + 4) >> 2] = c + 1;
                          c = K[c | 0];
                        } else {
                          c = Ca(b);
                        }
                        continue;
                      }
                      break;
                    }
                    F: {
                      if (!I) {
                        c = J[(b + 116) >> 2];
                        if ((c | 0) > 0) {
                          c = 1;
                        } else {
                          c = (c | 0) >= 0;
                        }
                        G: {
                          H: {
                            if (c) {
                              c = J[(b + 4) >> 2];
                              J[(b + 4) >> 2] = c - 1;
                              if (!d) {
                                break H;
                              }
                              J[(b + 4) >> 2] = c - 2;
                              if (!C) {
                                break G;
                              }
                              J[(b + 4) >> 2] = c - 3;
                              break G;
                            }
                            if (d) {
                              break G;
                            }
                          }
                          hb(b, 0, 0);
                        }
                        x(0);
                        c = s(1) | 0;
                        d = s(0) | 0;
                        x(+(t | 0));
                        b = s(1) | 0;
                        s(0) | 0;
                        u(0, d | 0);
                        u(1, (c & 2147483647) | (b & -2147483648));
                        nb((e + 96) | 0, +w());
                        l = J[(e + 96) >> 2];
                        m = J[(e + 100) >> 2];
                        c = J[(e + 108) >> 2];
                        b = J[(e + 104) >> 2];
                        break F;
                      }
                      if ((((f | 0) <= 0) & (h >>> 0 <= 7)) | ((f | 0) < 0)) {
                        i = h;
                        j = f;
                        while (1) {
                          n = n << 4;
                          i = (i + 1) | 0;
                          j = i ? j : (j + 1) | 0;
                          if (j | ((i | 0) != 8)) {
                            continue;
                          }
                          break;
                        }
                      }
                      I: {
                        J: {
                          K: {
                            if ((c & -33) == 80) {
                              i = $e(b, d);
                              c = na;
                              j = c;
                              if (i | ((c | 0) != -2147483648)) {
                                break I;
                              }
                              if (d) {
                                c = J[(b + 116) >> 2];
                                if ((c | 0) > 0) {
                                  c = 1;
                                } else {
                                  c = (c | 0) >= 0;
                                }
                                if (c) {
                                  break K;
                                }
                                break J;
                              }
                              l = 0;
                              m = 0;
                              hb(b, 0, 0);
                              c = 0;
                              b = 0;
                              break F;
                            }
                            i = 0;
                            j = 0;
                            if (J[(b + 116) >> 2] < 0) {
                              break I;
                            }
                          }
                          J[(b + 4) >> 2] = J[(b + 4) >> 2] - 1;
                        }
                        i = 0;
                        j = 0;
                      }
                      if (!n) {
                        x(0);
                        c = s(1) | 0;
                        d = s(0) | 0;
                        x(+(t | 0));
                        b = s(1) | 0;
                        s(0) | 0;
                        u(0, d | 0);
                        u(1, (c & 2147483647) | (b & -2147483648));
                        nb((e + 112) | 0, +w());
                        l = J[(e + 112) >> 2];
                        m = J[(e + 116) >> 2];
                        c = J[(e + 124) >> 2];
                        b = J[(e + 120) >> 2];
                        break F;
                      }
                      b = C ? q : h;
                      d = (i + (b << 2)) | 0;
                      h = (d - 32) | 0;
                      c = (0 - L) | 0;
                      b = (j + (((C ? v : f) << 2) | (b >>> 30))) | 0;
                      f =
                        ((d >>> 0 < i >>> 0 ? (b + 1) | 0 : b) -
                          (d >>> 0 < 32)) |
                        0;
                      b = f;
                      if ((b | 0) > 0) {
                        b = 1;
                      } else {
                        b = (c >>> 0 < h >>> 0) & ((b | 0) >= 0);
                      }
                      if (b) {
                        J[4158] = 68;
                        Za((e + 160) | 0, t);
                        Fa(
                          (e + 144) | 0,
                          J[(e + 160) >> 2],
                          J[(e + 164) >> 2],
                          J[(e + 168) >> 2],
                          J[(e + 172) >> 2],
                          -1,
                          -1,
                          -1,
                          2147418111,
                        );
                        Fa(
                          (e + 128) | 0,
                          J[(e + 144) >> 2],
                          J[(e + 148) >> 2],
                          J[(e + 152) >> 2],
                          J[(e + 156) >> 2],
                          -1,
                          -1,
                          -1,
                          2147418111,
                        );
                        l = J[(e + 128) >> 2];
                        m = J[(e + 132) >> 2];
                        c = J[(e + 140) >> 2];
                        b = J[(e + 136) >> 2];
                        break F;
                      }
                      c = (L - 226) | 0;
                      b = c >> 31;
                      if (
                        (((f | 0) >= (b | 0)) & (c >>> 0 <= h >>> 0)) |
                        ((b | 0) < (f | 0))
                      ) {
                        if ((n | 0) >= 0) {
                          while (1) {
                            Ya((e + 416) | 0, l, m, A, B, 0, 0, 0, -1073807360);
                            b = gf(l, m, A, B, 1073610752);
                            b = (b | 0) >= 0;
                            Ya(
                              (e + 400) | 0,
                              l,
                              m,
                              A,
                              B,
                              b ? J[(e + 416) >> 2] : l,
                              b ? J[(e + 420) >> 2] : m,
                              b ? J[(e + 424) >> 2] : A,
                              b ? J[(e + 428) >> 2] : B,
                            );
                            c = n << 1;
                            n = c | b;
                            b = h;
                            h = (b - 1) | 0;
                            f = (f - !b) | 0;
                            A = J[(e + 408) >> 2];
                            B = J[(e + 412) >> 2];
                            l = J[(e + 400) >> 2];
                            m = J[(e + 404) >> 2];
                            if ((c | 0) >= 0) {
                              continue;
                            }
                            break;
                          }
                        }
                        b = (32 - L) | 0;
                        c = (b + h) | 0;
                        b = b >>> 0 > c >>> 0 ? (f + 1) | 0 : f;
                        b =
                          ((c >>> 0 < G >>> 0) & ((b | 0) <= 0)) | ((b | 0) < 0)
                            ? (c | 0) > 0
                              ? c
                              : 0
                            : G;
                        L: {
                          if (b >>> 0 >= 113) {
                            Za((e + 384) | 0, t);
                            i = J[(e + 392) >> 2];
                            j = J[(e + 396) >> 2];
                            D = J[(e + 384) >> 2];
                            E = J[(e + 388) >> 2];
                            f = 0;
                            c = 0;
                            break L;
                          }
                          nb((e + 352) | 0, dd((144 - b) | 0));
                          Za((e + 336) | 0, t);
                          D = J[(e + 336) >> 2];
                          E = J[(e + 340) >> 2];
                          i = J[(e + 344) >> 2];
                          j = J[(e + 348) >> 2];
                          ff(
                            (e + 368) | 0,
                            J[(e + 352) >> 2],
                            J[(e + 356) >> 2],
                            J[(e + 360) >> 2],
                            J[(e + 364) >> 2],
                            j,
                          );
                          y = J[(e + 376) >> 2];
                          z = J[(e + 380) >> 2];
                          f = J[(e + 372) >> 2];
                          c = J[(e + 368) >> 2];
                        }
                        b =
                          !(n & 1) &
                          (((Fb(l, m, A, B, 0, 0, 0, 0) | 0) != 0) &
                            (b >>> 0 < 32));
                        Nb((e + 320) | 0, b | n);
                        Fa(
                          (e + 304) | 0,
                          D,
                          E,
                          i,
                          j,
                          J[(e + 320) >> 2],
                          J[(e + 324) >> 2],
                          J[(e + 328) >> 2],
                          J[(e + 332) >> 2],
                        );
                        Ya(
                          (e + 272) | 0,
                          J[(e + 304) >> 2],
                          J[(e + 308) >> 2],
                          J[(e + 312) >> 2],
                          J[(e + 316) >> 2],
                          c,
                          f,
                          y,
                          z,
                        );
                        Fa(
                          (e + 288) | 0,
                          D,
                          E,
                          i,
                          j,
                          b ? 0 : l,
                          b ? 0 : m,
                          b ? 0 : A,
                          b ? 0 : B,
                        );
                        Ya(
                          (e + 256) | 0,
                          J[(e + 288) >> 2],
                          J[(e + 292) >> 2],
                          J[(e + 296) >> 2],
                          J[(e + 300) >> 2],
                          J[(e + 272) >> 2],
                          J[(e + 276) >> 2],
                          J[(e + 280) >> 2],
                          J[(e + 284) >> 2],
                        );
                        cd(
                          (e + 240) | 0,
                          J[(e + 256) >> 2],
                          J[(e + 260) >> 2],
                          J[(e + 264) >> 2],
                          J[(e + 268) >> 2],
                          c,
                          f,
                          y,
                          z,
                        );
                        f = J[(e + 240) >> 2];
                        d = J[(e + 244) >> 2];
                        c = J[(e + 248) >> 2];
                        b = J[(e + 252) >> 2];
                        if (!Fb(f, d, c, b, 0, 0, 0, 0)) {
                          J[4158] = 68;
                        }
                        df((e + 224) | 0, f, d, c, b, h);
                        l = J[(e + 224) >> 2];
                        m = J[(e + 228) >> 2];
                        c = J[(e + 236) >> 2];
                        b = J[(e + 232) >> 2];
                        break F;
                      }
                      J[4158] = 68;
                      Za((e + 208) | 0, t);
                      Fa(
                        (e + 192) | 0,
                        J[(e + 208) >> 2],
                        J[(e + 212) >> 2],
                        J[(e + 216) >> 2],
                        J[(e + 220) >> 2],
                        0,
                        0,
                        0,
                        65536,
                      );
                      Fa(
                        (e + 176) | 0,
                        J[(e + 192) >> 2],
                        J[(e + 196) >> 2],
                        J[(e + 200) >> 2],
                        J[(e + 204) >> 2],
                        0,
                        0,
                        0,
                        65536,
                      );
                      l = J[(e + 176) >> 2];
                      m = J[(e + 180) >> 2];
                      c = J[(e + 188) >> 2];
                      b = J[(e + 184) >> 2];
                    }
                    J[(p + 16) >> 2] = l;
                    J[(p + 20) >> 2] = m;
                    J[(p + 24) >> 2] = b;
                    J[(p + 28) >> 2] = c;
                    ka = (e + 432) | 0;
                    h = J[(p + 24) >> 2];
                    f = J[(p + 28) >> 2];
                    i = J[(p + 16) >> 2];
                    j = J[(p + 20) >> 2];
                    break a;
                  }
                  if (J[(b + 116) >> 2] < 0) {
                    break u;
                  }
                  J[(b + 4) >> 2] = J[(b + 4) >> 2] - 1;
                }
                k = b;
                g = c;
                r = d;
                d = 0;
                e = (ka - 8976) | 0;
                ka = e;
                y = (0 - L) | 0;
                I = (y - G) | 0;
                M: {
                  N: {
                    while (1) {
                      if ((g | 0) != 48) {
                        O: {
                          if ((g | 0) != 46) {
                            break M;
                          }
                          b = J[(k + 4) >> 2];
                          if ((b | 0) == J[(k + 104) >> 2]) {
                            break O;
                          }
                          J[(k + 4) >> 2] = b + 1;
                          g = K[b | 0];
                          break N;
                        }
                      } else {
                        b = J[(k + 4) >> 2];
                        if ((b | 0) != J[(k + 104) >> 2]) {
                          J[(k + 4) >> 2] = b + 1;
                          g = K[b | 0];
                        } else {
                          g = Ca(k);
                        }
                        d = 1;
                        continue;
                      }
                      break;
                    }
                    g = Ca(k);
                  }
                  if ((g | 0) == 48) {
                    while (1) {
                      b = h;
                      h = (b - 1) | 0;
                      f = (f - !b) | 0;
                      b = J[(k + 4) >> 2];
                      P: {
                        if ((b | 0) != J[(k + 104) >> 2]) {
                          J[(k + 4) >> 2] = b + 1;
                          g = K[b | 0];
                          break P;
                        }
                        g = Ca(k);
                      }
                      if ((g | 0) == 48) {
                        continue;
                      }
                      break;
                    }
                    d = 1;
                  }
                  C = 1;
                }
                J[(e + 784) >> 2] = 0;
                Q: {
                  R: {
                    b = (g | 0) == 46;
                    c = (g - 48) | 0;
                    S: {
                      T: {
                        U: {
                          if (b | (c >>> 0 <= 9)) {
                            while (1) {
                              V: {
                                if (b & 1) {
                                  if (!C) {
                                    h = i;
                                    f = j;
                                    C = 1;
                                    break V;
                                  }
                                  b = !d;
                                  break U;
                                }
                                i = (i + 1) | 0;
                                j = i ? j : (j + 1) | 0;
                                if ((n | 0) <= 2044) {
                                  z = (g | 0) == 48 ? z : i;
                                  b = (((e + 784) | 0) + (n << 2)) | 0;
                                  J[b >> 2] = o
                                    ? (((P(J[b >> 2], 10) + g) | 0) - 48) | 0
                                    : c;
                                  d = 1;
                                  b = (o + 1) | 0;
                                  c = (b | 0) == 9;
                                  o = c ? 0 : b;
                                  n = (c + n) | 0;
                                  break V;
                                }
                                if ((g | 0) == 48) {
                                  break V;
                                }
                                J[(e + 8960) >> 2] = J[(e + 8960) >> 2] | 1;
                                z = 18396;
                              }
                              b = J[(k + 4) >> 2];
                              W: {
                                if ((b | 0) != J[(k + 104) >> 2]) {
                                  J[(k + 4) >> 2] = b + 1;
                                  g = K[b | 0];
                                  break W;
                                }
                                g = Ca(k);
                              }
                              b = (g | 0) == 46;
                              c = (g - 48) | 0;
                              if (b | (c >>> 0 < 10)) {
                                continue;
                              }
                              break;
                            }
                          }
                          h = C ? h : i;
                          f = C ? f : j;
                          if (!(!d | ((g & -33) != 69))) {
                            l = $e(k, r);
                            b = na;
                            m = b;
                            X: {
                              if (l | ((b | 0) != -2147483648)) {
                                break X;
                              }
                              if (!r) {
                                break S;
                              }
                              l = 0;
                              m = 0;
                              if (J[(k + 116) >> 2] < 0) {
                                break X;
                              }
                              J[(k + 4) >> 2] = J[(k + 4) >> 2] - 1;
                            }
                            b = (f + m) | 0;
                            h = (h + l) | 0;
                            f = h >>> 0 < l >>> 0 ? (b + 1) | 0 : b;
                            break R;
                          }
                          b = !d;
                          if ((g | 0) < 0) {
                            break T;
                          }
                        }
                        if (J[(k + 116) >> 2] < 0) {
                          break T;
                        }
                        J[(k + 4) >> 2] = J[(k + 4) >> 2] - 1;
                      }
                      if (!b) {
                        break R;
                      }
                      J[4158] = 28;
                    }
                    hb(k, 0, 0);
                    h = 0;
                    f = 0;
                    c = 0;
                    b = 0;
                    break Q;
                  }
                  b = J[(e + 784) >> 2];
                  if (!b) {
                    x(0);
                    c = s(1) | 0;
                    d = s(0) | 0;
                    x(+(t | 0));
                    b = s(1) | 0;
                    s(0) | 0;
                    u(0, d | 0);
                    u(1, (c & 2147483647) | (b & -2147483648));
                    nb(e, +w());
                    h = J[(e + 8) >> 2];
                    f = J[(e + 12) >> 2];
                    c = J[(e + 4) >> 2];
                    b = J[e >> 2];
                    break Q;
                  }
                  if (
                    !(
                      ((h | 0) != (i | 0)) |
                      ((f | 0) != (j | 0)) |
                      (((i >>> 0 > 9) & ((j | 0) >= 0)) | ((j | 0) > 0)) |
                      ((b >>> G) | 0 ? G >>> 0 <= 30 : 0)
                    )
                  ) {
                    Za((e + 48) | 0, t);
                    Nb((e + 32) | 0, b);
                    Fa(
                      (e + 16) | 0,
                      J[(e + 48) >> 2],
                      J[(e + 52) >> 2],
                      J[(e + 56) >> 2],
                      J[(e + 60) >> 2],
                      J[(e + 32) >> 2],
                      J[(e + 36) >> 2],
                      J[(e + 40) >> 2],
                      J[(e + 44) >> 2],
                    );
                    h = J[(e + 24) >> 2];
                    f = J[(e + 28) >> 2];
                    c = J[(e + 20) >> 2];
                    b = J[(e + 16) >> 2];
                    break Q;
                  }
                  if (
                    (((y >>> 1) >>> 0 < h >>> 0) & ((f | 0) >= 0)) |
                    ((f | 0) > 0)
                  ) {
                    J[4158] = 68;
                    Za((e + 96) | 0, t);
                    Fa(
                      (e + 80) | 0,
                      J[(e + 96) >> 2],
                      J[(e + 100) >> 2],
                      J[(e + 104) >> 2],
                      J[(e + 108) >> 2],
                      -1,
                      -1,
                      -1,
                      2147418111,
                    );
                    Fa(
                      (e - -64) | 0,
                      J[(e + 80) >> 2],
                      J[(e + 84) >> 2],
                      J[(e + 88) >> 2],
                      J[(e + 92) >> 2],
                      -1,
                      -1,
                      -1,
                      2147418111,
                    );
                    h = J[(e + 72) >> 2];
                    f = J[(e + 76) >> 2];
                    c = J[(e + 68) >> 2];
                    b = J[(e + 64) >> 2];
                    break Q;
                  }
                  b = (L - 226) | 0;
                  c = h >>> 0 < b >>> 0;
                  b = b >> 31;
                  if ((c & ((f | 0) <= (b | 0))) | ((b | 0) > (f | 0))) {
                    J[4158] = 68;
                    Za((e + 144) | 0, t);
                    Fa(
                      (e + 128) | 0,
                      J[(e + 144) >> 2],
                      J[(e + 148) >> 2],
                      J[(e + 152) >> 2],
                      J[(e + 156) >> 2],
                      0,
                      0,
                      0,
                      65536,
                    );
                    Fa(
                      (e + 112) | 0,
                      J[(e + 128) >> 2],
                      J[(e + 132) >> 2],
                      J[(e + 136) >> 2],
                      J[(e + 140) >> 2],
                      0,
                      0,
                      0,
                      65536,
                    );
                    h = J[(e + 120) >> 2];
                    f = J[(e + 124) >> 2];
                    c = J[(e + 116) >> 2];
                    b = J[(e + 112) >> 2];
                    break Q;
                  }
                  if (o) {
                    if ((o | 0) <= 8) {
                      b = (((e + 784) | 0) + (n << 2)) | 0;
                      g = J[b >> 2];
                      while (1) {
                        g = P(g, 10);
                        o = (o + 1) | 0;
                        if ((o | 0) != 9) {
                          continue;
                        }
                        break;
                      }
                      J[b >> 2] = g;
                    }
                    n = (n + 1) | 0;
                  }
                  o = h;
                  Y: {
                    if (
                      ((h >>> 0 > 17) & ((f | 0) >= 0)) |
                      ((f | 0) > 0) |
                      ((z | 0) >= 9) |
                      ((h | 0) < (z | 0))
                    ) {
                      break Y;
                    }
                    if (!f & ((h | 0) == 9)) {
                      Za((e + 192) | 0, t);
                      Nb((e + 176) | 0, J[(e + 784) >> 2]);
                      Fa(
                        (e + 160) | 0,
                        J[(e + 192) >> 2],
                        J[(e + 196) >> 2],
                        J[(e + 200) >> 2],
                        J[(e + 204) >> 2],
                        J[(e + 176) >> 2],
                        J[(e + 180) >> 2],
                        J[(e + 184) >> 2],
                        J[(e + 188) >> 2],
                      );
                      h = J[(e + 168) >> 2];
                      f = J[(e + 172) >> 2];
                      c = J[(e + 164) >> 2];
                      b = J[(e + 160) >> 2];
                      break Q;
                    }
                    if ((((f | 0) <= 0) & (h >>> 0 <= 8)) | ((f | 0) < 0)) {
                      Za((e + 272) | 0, t);
                      Nb((e + 256) | 0, J[(e + 784) >> 2]);
                      Fa(
                        (e + 240) | 0,
                        J[(e + 272) >> 2],
                        J[(e + 276) >> 2],
                        J[(e + 280) >> 2],
                        J[(e + 284) >> 2],
                        J[(e + 256) >> 2],
                        J[(e + 260) >> 2],
                        J[(e + 264) >> 2],
                        J[(e + 268) >> 2],
                      );
                      Za((e + 224) | 0, J[(((8 - o) << 2) + 7184) >> 2]);
                      cf(
                        (e + 208) | 0,
                        J[(e + 240) >> 2],
                        J[(e + 244) >> 2],
                        J[(e + 248) >> 2],
                        J[(e + 252) >> 2],
                        J[(e + 224) >> 2],
                        J[(e + 228) >> 2],
                        J[(e + 232) >> 2],
                        J[(e + 236) >> 2],
                      );
                      h = J[(e + 216) >> 2];
                      f = J[(e + 220) >> 2];
                      c = J[(e + 212) >> 2];
                      b = J[(e + 208) >> 2];
                      break Q;
                    }
                    c = (((P(o, -3) + G) | 0) + 27) | 0;
                    b = J[(e + 784) >> 2];
                    if ((b >>> c) | 0 ? (c | 0) <= 30 : 0) {
                      break Y;
                    }
                    Za((e + 352) | 0, t);
                    Nb((e + 336) | 0, b);
                    Fa(
                      (e + 320) | 0,
                      J[(e + 352) >> 2],
                      J[(e + 356) >> 2],
                      J[(e + 360) >> 2],
                      J[(e + 364) >> 2],
                      J[(e + 336) >> 2],
                      J[(e + 340) >> 2],
                      J[(e + 344) >> 2],
                      J[(e + 348) >> 2],
                    );
                    Za((e + 304) | 0, J[((o << 2) + 7144) >> 2]);
                    Fa(
                      (e + 288) | 0,
                      J[(e + 320) >> 2],
                      J[(e + 324) >> 2],
                      J[(e + 328) >> 2],
                      J[(e + 332) >> 2],
                      J[(e + 304) >> 2],
                      J[(e + 308) >> 2],
                      J[(e + 312) >> 2],
                      J[(e + 316) >> 2],
                    );
                    h = J[(e + 296) >> 2];
                    f = J[(e + 300) >> 2];
                    c = J[(e + 292) >> 2];
                    b = J[(e + 288) >> 2];
                    break Q;
                  }
                  while (1) {
                    b = n;
                    n = (b - 1) | 0;
                    j = (((e + 784) | 0) + (b << 2)) | 0;
                    if (!J[(j - 4) >> 2]) {
                      continue;
                    }
                    break;
                  }
                  z = 0;
                  c = ((o | 0) % 9) | 0;
                  Z: {
                    if (!c) {
                      c = 0;
                      break Z;
                    }
                    k = (f | 0) < 0 ? (c + 9) | 0 : c;
                    _: {
                      if (!b) {
                        c = 0;
                        b = 0;
                        break _;
                      }
                      n = J[(((0 - k) << 2) + 7216) >> 2];
                      i = (1e9 / (n | 0)) | 0;
                      c = 0;
                      d = 0;
                      g = 0;
                      while (1) {
                        m = d;
                        d = (((e + 784) | 0) + (g << 2)) | 0;
                        f = J[d >> 2];
                        h = ((f >>> 0) / (n >>> 0)) | 0;
                        r = (m + h) | 0;
                        J[d >> 2] = r;
                        d = !r & ((c | 0) == (g | 0));
                        c = d ? (c + 1) & 2047 : c;
                        o = d ? (o - 9) | 0 : o;
                        d = P(i, (f - P(h, n)) | 0);
                        g = (g + 1) | 0;
                        if ((g | 0) != (b | 0)) {
                          continue;
                        }
                        break;
                      }
                      if (!d) {
                        break _;
                      }
                      J[j >> 2] = d;
                      b = (b + 1) | 0;
                    }
                    o = (((o - k) | 0) + 9) | 0;
                  }
                  while (1) {
                    k = (((e + 784) | 0) + (c << 2)) | 0;
                    r = (o | 0) < 36;
                    $: {
                      while (1) {
                        if (!r & (((o | 0) != 36) | (M[k >> 2] >= 10384593))) {
                          break $;
                        }
                        n = (b + 2047) | 0;
                        d = 0;
                        while (1) {
                          i = b;
                          y = n & 2047;
                          g = (((e + 784) | 0) + (y << 2)) | 0;
                          b = J[g >> 2];
                          f = (b >>> 3) | 0;
                          b = b << 29;
                          h = (d + b) | 0;
                          f = b >>> 0 > h >>> 0 ? (f + 1) | 0 : f;
                          if (!f & (h >>> 0 < 1000000001)) {
                            d = 0;
                          } else {
                            b = h;
                            d = bk(b, f, 1e9);
                            j = dk(d, na, 1e9, 0);
                            h = (b - j) | 0;
                            f = (f - ((na + (b >>> 0 < j >>> 0)) | 0)) | 0;
                          }
                          J[g >> 2] = h;
                          b = f | h ? i : y;
                          h = (i - 1) & 2047;
                          b =
                            (c | 0) == (y | 0) ? i : (h | 0) != (y | 0) ? i : b;
                          n = (y - 1) | 0;
                          if ((c | 0) != (y | 0)) {
                            continue;
                          }
                          break;
                        }
                        z = (z - 29) | 0;
                        b = i;
                        if (!d) {
                          continue;
                        }
                        break;
                      }
                      c = (c - 1) & 2047;
                      if ((c | 0) == (b | 0)) {
                        f = (e + 784) | 0;
                        b = (f + (((b + 2046) & 2047) << 2)) | 0;
                        J[b >> 2] = J[b >> 2] | J[(f + (h << 2)) >> 2];
                        b = h;
                      }
                      o = (o + 9) | 0;
                      J[(((e + 784) | 0) + (c << 2)) >> 2] = d;
                      continue;
                    }
                    break;
                  }
                  aa: {
                    ba: while (1) {
                      h = (b + 1) & 2047;
                      k = (((e + 784) | 0) + (((b - 1) & 2047) << 2)) | 0;
                      while (1) {
                        y = (o | 0) > 45 ? 9 : 1;
                        ca: {
                          while (1) {
                            d = c;
                            g = 0;
                            da: {
                              while (1) {
                                ea: {
                                  c = (d + g) & 2047;
                                  if ((c | 0) == (b | 0)) {
                                    break ea;
                                  }
                                  f = J[(((e + 784) | 0) + (c << 2)) >> 2];
                                  c = J[((g << 2) + 7168) >> 2];
                                  if (f >>> 0 < c >>> 0) {
                                    break ea;
                                  }
                                  if (c >>> 0 < f >>> 0) {
                                    break da;
                                  }
                                  g = (g + 1) | 0;
                                  if ((g | 0) != 4) {
                                    continue;
                                  }
                                }
                                break;
                              }
                              if ((o | 0) != 36) {
                                break da;
                              }
                              h = 0;
                              f = 0;
                              g = 0;
                              i = 0;
                              j = 0;
                              while (1) {
                                c = (d + g) & 2047;
                                if ((c | 0) == (b | 0)) {
                                  b = (b + 1) & 2047;
                                  J[((((b << 2) + e) | 0) + 780) >> 2] = 0;
                                }
                                Nb(
                                  (e + 768) | 0,
                                  J[(((e + 784) | 0) + (c << 2)) >> 2],
                                );
                                Fa(
                                  (e + 752) | 0,
                                  i,
                                  j,
                                  h,
                                  f,
                                  0,
                                  0,
                                  1342177280,
                                  1075633366,
                                );
                                Ya(
                                  (e + 736) | 0,
                                  J[(e + 752) >> 2],
                                  J[(e + 756) >> 2],
                                  J[(e + 760) >> 2],
                                  J[(e + 764) >> 2],
                                  J[(e + 768) >> 2],
                                  J[(e + 772) >> 2],
                                  J[(e + 776) >> 2],
                                  J[(e + 780) >> 2],
                                );
                                h = J[(e + 744) >> 2];
                                f = J[(e + 748) >> 2];
                                i = J[(e + 736) >> 2];
                                j = J[(e + 740) >> 2];
                                g = (g + 1) | 0;
                                if ((g | 0) != 4) {
                                  continue;
                                }
                                break;
                              }
                              Za((e + 720) | 0, t);
                              Fa(
                                (e + 704) | 0,
                                i,
                                j,
                                h,
                                f,
                                J[(e + 720) >> 2],
                                J[(e + 724) >> 2],
                                J[(e + 728) >> 2],
                                J[(e + 732) >> 2],
                              );
                              h = 0;
                              f = 0;
                              i = J[(e + 712) >> 2];
                              j = J[(e + 716) >> 2];
                              l = J[(e + 704) >> 2];
                              m = J[(e + 708) >> 2];
                              g = (z + 113) | 0;
                              n = (g - L) | 0;
                              r = (n | 0) < (G | 0);
                              k = r ? ((n | 0) > 0 ? n : 0) : G;
                              if (k >>> 0 <= 112) {
                                break ca;
                              }
                              break aa;
                            }
                            z = (z + y) | 0;
                            c = b;
                            if ((b | 0) == (d | 0)) {
                              continue;
                            }
                            break;
                          }
                          n = (1e9 >>> y) | 0;
                          r = (-1 << y) ^ -1;
                          g = 0;
                          c = d;
                          while (1) {
                            j = (e + 784) | 0;
                            f = (j + (d << 2)) | 0;
                            i = J[f >> 2];
                            g = (g + ((i >>> y) | 0)) | 0;
                            J[f >> 2] = g;
                            f = !g & ((c | 0) == (d | 0));
                            c = f ? (c + 1) & 2047 : c;
                            o = f ? (o - 9) | 0 : o;
                            g = P(n, i & r);
                            d = (d + 1) & 2047;
                            if ((d | 0) != (b | 0)) {
                              continue;
                            }
                            break;
                          }
                          if (!g) {
                            continue;
                          }
                          if ((c | 0) != (h | 0)) {
                            J[(j + (b << 2)) >> 2] = g;
                            b = h;
                            continue ba;
                          }
                          J[k >> 2] = J[k >> 2] | 1;
                          continue;
                        }
                        break;
                      }
                      break;
                    }
                    nb((e + 656) | 0, dd((225 - k) | 0));
                    ff(
                      (e + 688) | 0,
                      J[(e + 656) >> 2],
                      J[(e + 660) >> 2],
                      J[(e + 664) >> 2],
                      J[(e + 668) >> 2],
                      j,
                    );
                    D = J[(e + 696) >> 2];
                    E = J[(e + 700) >> 2];
                    A = J[(e + 688) >> 2];
                    B = J[(e + 692) >> 2];
                    nb((e + 640) | 0, dd((113 - k) | 0));
                    bf(
                      (e + 672) | 0,
                      l,
                      m,
                      i,
                      j,
                      J[(e + 640) >> 2],
                      J[(e + 644) >> 2],
                      J[(e + 648) >> 2],
                      J[(e + 652) >> 2],
                    );
                    h = J[(e + 672) >> 2];
                    f = J[(e + 676) >> 2];
                    q = J[(e + 680) >> 2];
                    v = J[(e + 684) >> 2];
                    cd((e + 624) | 0, l, m, i, j, h, f, q, v);
                    Ya(
                      (e + 608) | 0,
                      A,
                      B,
                      D,
                      E,
                      J[(e + 624) >> 2],
                      J[(e + 628) >> 2],
                      J[(e + 632) >> 2],
                      J[(e + 636) >> 2],
                    );
                    i = J[(e + 616) >> 2];
                    j = J[(e + 620) >> 2];
                    l = J[(e + 608) >> 2];
                    m = J[(e + 612) >> 2];
                  }
                  c = (d + 4) & 2047;
                  fa: {
                    if ((c | 0) == (b | 0)) {
                      break fa;
                    }
                    c = J[(((e + 784) | 0) + (c << 2)) >> 2];
                    ga: {
                      if (c >>> 0 <= 499999999) {
                        if (!c & (((d + 5) & 2047) == (b | 0))) {
                          break ga;
                        }
                        nb((e + 496) | 0, +(t | 0) * 0.25);
                        Ya(
                          (e + 480) | 0,
                          h,
                          f,
                          q,
                          v,
                          J[(e + 496) >> 2],
                          J[(e + 500) >> 2],
                          J[(e + 504) >> 2],
                          J[(e + 508) >> 2],
                        );
                        q = J[(e + 488) >> 2];
                        v = J[(e + 492) >> 2];
                        h = J[(e + 480) >> 2];
                        f = J[(e + 484) >> 2];
                        break ga;
                      }
                      if ((c | 0) != 5e8) {
                        nb((e + 592) | 0, +(t | 0) * 0.75);
                        Ya(
                          (e + 576) | 0,
                          h,
                          f,
                          q,
                          v,
                          J[(e + 592) >> 2],
                          J[(e + 596) >> 2],
                          J[(e + 600) >> 2],
                          J[(e + 604) >> 2],
                        );
                        q = J[(e + 584) >> 2];
                        v = J[(e + 588) >> 2];
                        h = J[(e + 576) >> 2];
                        f = J[(e + 580) >> 2];
                        break ga;
                      }
                      N = +(t | 0);
                      if (((d + 5) & 2047) == (b | 0)) {
                        nb((e + 528) | 0, N * 0.5);
                        Ya(
                          (e + 512) | 0,
                          h,
                          f,
                          q,
                          v,
                          J[(e + 528) >> 2],
                          J[(e + 532) >> 2],
                          J[(e + 536) >> 2],
                          J[(e + 540) >> 2],
                        );
                        q = J[(e + 520) >> 2];
                        v = J[(e + 524) >> 2];
                        h = J[(e + 512) >> 2];
                        f = J[(e + 516) >> 2];
                        break ga;
                      }
                      nb((e + 560) | 0, N * 0.75);
                      Ya(
                        (e + 544) | 0,
                        h,
                        f,
                        q,
                        v,
                        J[(e + 560) >> 2],
                        J[(e + 564) >> 2],
                        J[(e + 568) >> 2],
                        J[(e + 572) >> 2],
                      );
                      q = J[(e + 552) >> 2];
                      v = J[(e + 556) >> 2];
                      h = J[(e + 544) >> 2];
                      f = J[(e + 548) >> 2];
                    }
                    if (k >>> 0 > 111) {
                      break fa;
                    }
                    bf((e + 464) | 0, h, f, q, v, 0, 0, 0, 1073676288);
                    if (
                      Fb(
                        J[(e + 464) >> 2],
                        J[(e + 468) >> 2],
                        J[(e + 472) >> 2],
                        J[(e + 476) >> 2],
                        0,
                        0,
                        0,
                        0,
                      )
                    ) {
                      break fa;
                    }
                    Ya((e + 448) | 0, h, f, q, v, 0, 0, 0, 1073676288);
                    q = J[(e + 456) >> 2];
                    v = J[(e + 460) >> 2];
                    h = J[(e + 448) >> 2];
                    f = J[(e + 452) >> 2];
                  }
                  Ya((e + 432) | 0, l, m, i, j, h, f, q, v);
                  cd(
                    (e + 416) | 0,
                    J[(e + 432) >> 2],
                    J[(e + 436) >> 2],
                    J[(e + 440) >> 2],
                    J[(e + 444) >> 2],
                    A,
                    B,
                    D,
                    E,
                  );
                  i = J[(e + 424) >> 2];
                  j = J[(e + 428) >> 2];
                  l = J[(e + 416) >> 2];
                  m = J[(e + 420) >> 2];
                  ha: {
                    if (((I - 2) | 0) >= (g & 2147483647)) {
                      break ha;
                    }
                    J[(e + 408) >> 2] = i;
                    J[(e + 412) >> 2] = j & 2147483647;
                    J[(e + 400) >> 2] = l;
                    J[(e + 404) >> 2] = m;
                    Fa((e + 384) | 0, l, m, i, j, 0, 0, 0, 1073610752);
                    b = gf(
                      J[(e + 400) >> 2],
                      J[(e + 404) >> 2],
                      J[(e + 408) >> 2],
                      J[(e + 412) >> 2],
                      1081081856,
                    );
                    c = (b | 0) >= 0;
                    i = c ? J[(e + 392) >> 2] : i;
                    j = c ? J[(e + 396) >> 2] : j;
                    l = c ? J[(e + 384) >> 2] : l;
                    m = c ? J[(e + 388) >> 2] : m;
                    z = (c + z) | 0;
                    if (
                      !(
                        r &
                        (((k | 0) != (n | 0)) | ((b | 0) < 0)) &
                        ((Fb(h, f, q, v, 0, 0, 0, 0) | 0) != 0)
                      ) &
                      (((z + 110) | 0) <= (I | 0))
                    ) {
                      break ha;
                    }
                    J[4158] = 68;
                  }
                  df((e + 368) | 0, l, m, i, j, z);
                  h = J[(e + 376) >> 2];
                  f = J[(e + 380) >> 2];
                  c = J[(e + 372) >> 2];
                  b = J[(e + 368) >> 2];
                }
                J[(p + 40) >> 2] = h;
                J[(p + 44) >> 2] = f;
                J[(p + 32) >> 2] = b;
                J[(p + 36) >> 2] = c;
                ka = (e + 8976) | 0;
                h = J[(p + 40) >> 2];
                f = J[(p + 44) >> 2];
                i = J[(p + 32) >> 2];
                j = J[(p + 36) >> 2];
                break a;
              }
              break a;
            }
            f = 0;
          }
          J[a >> 2] = i;
          J[(a + 4) >> 2] = j;
          J[(a + 8) >> 2] = h;
          J[(a + 12) >> 2] = f;
          ka = (p + 48) | 0;
        }
        function Wa(a) {
          a = a | 0;
          var b = 0,
            c = 0,
            d = 0,
            e = 0,
            f = 0,
            g = 0,
            h = 0,
            i = 0,
            j = 0,
            k = 0,
            l = 0,
            m = 0,
            n = 0;
          k = (ka - 16) | 0;
          ka = k;
          a: {
            b: {
              c: {
                d: {
                  e: {
                    f: {
                      g: {
                        h: {
                          i: {
                            j: {
                              if (a >>> 0 <= 244) {
                                f = J[4159];
                                g = a >>> 0 < 11 ? 16 : (a + 11) & 504;
                                a = (g >>> 3) | 0;
                                b = (f >>> a) | 0;
                                if (b & 3) {
                                  e = (a + ((b ^ -1) & 1)) | 0;
                                  b = e << 3;
                                  a = (b + 16676) | 0;
                                  c = J[(b + 16684) >> 2];
                                  d = J[(c + 8) >> 2];
                                  k: {
                                    if ((a | 0) == (d | 0)) {
                                      ((m = 16636),
                                        (n = fk(-2, e) & f),
                                        (J[m >> 2] = n));
                                      break k;
                                    }
                                    J[(d + 12) >> 2] = a;
                                    J[(a + 8) >> 2] = d;
                                  }
                                  a = (c + 8) | 0;
                                  J[(c + 4) >> 2] = b | 3;
                                  b = (b + c) | 0;
                                  J[(b + 4) >> 2] = J[(b + 4) >> 2] | 1;
                                  break a;
                                }
                                i = J[4161];
                                if (i >>> 0 >= g >>> 0) {
                                  break j;
                                }
                                if (b) {
                                  c = 2 << a;
                                  e = ck(((0 - c) | c) & (b << a));
                                  a = e << 3;
                                  b = (a + 16676) | 0;
                                  c = J[(a + 16684) >> 2];
                                  d = J[(c + 8) >> 2];
                                  l: {
                                    if ((b | 0) == (d | 0)) {
                                      f = fk(-2, e) & f;
                                      J[4159] = f;
                                      break l;
                                    }
                                    J[(d + 12) >> 2] = b;
                                    J[(b + 8) >> 2] = d;
                                  }
                                  J[(c + 4) >> 2] = g | 3;
                                  h = (c + g) | 0;
                                  e = (a - g) | 0;
                                  J[(h + 4) >> 2] = e | 1;
                                  J[(a + c) >> 2] = e;
                                  if (i) {
                                    a = ((i & -8) + 16676) | 0;
                                    d = J[4164];
                                    b = 1 << (i >>> 3);
                                    m: {
                                      if (!(b & f)) {
                                        J[4159] = b | f;
                                        b = a;
                                        break m;
                                      }
                                      b = J[(a + 8) >> 2];
                                    }
                                    J[(a + 8) >> 2] = d;
                                    J[(b + 12) >> 2] = d;
                                    J[(d + 12) >> 2] = a;
                                    J[(d + 8) >> 2] = b;
                                  }
                                  a = (c + 8) | 0;
                                  J[4164] = h;
                                  J[4161] = e;
                                  break a;
                                }
                                l = J[4160];
                                if (!l) {
                                  break j;
                                }
                                b = J[((ck(l) << 2) + 16940) >> 2];
                                e = ((J[(b + 4) >> 2] & -8) - g) | 0;
                                c = b;
                                while (1) {
                                  n: {
                                    a = J[(b + 16) >> 2];
                                    if (!a) {
                                      a = J[(b + 20) >> 2];
                                      if (!a) {
                                        break n;
                                      }
                                    }
                                    d = ((J[(a + 4) >> 2] & -8) - g) | 0;
                                    b = d >>> 0 < e >>> 0;
                                    e = b ? d : e;
                                    c = b ? a : c;
                                    b = a;
                                    continue;
                                  }
                                  break;
                                }
                                j = J[(c + 24) >> 2];
                                a = J[(c + 12) >> 2];
                                if ((c | 0) != (a | 0)) {
                                  b = J[(c + 8) >> 2];
                                  J[(b + 12) >> 2] = a;
                                  J[(a + 8) >> 2] = b;
                                  break b;
                                }
                                b = J[(c + 20) >> 2];
                                if (b) {
                                  d = (c + 20) | 0;
                                } else {
                                  b = J[(c + 16) >> 2];
                                  if (!b) {
                                    break i;
                                  }
                                  d = (c + 16) | 0;
                                }
                                while (1) {
                                  h = d;
                                  a = b;
                                  d = (a + 20) | 0;
                                  b = J[(a + 20) >> 2];
                                  if (b) {
                                    continue;
                                  }
                                  d = (a + 16) | 0;
                                  b = J[(a + 16) >> 2];
                                  if (b) {
                                    continue;
                                  }
                                  break;
                                }
                                J[h >> 2] = 0;
                                break b;
                              }
                              g = -1;
                              if (a >>> 0 > 4294967231) {
                                break j;
                              }
                              b = (a + 11) | 0;
                              g = b & -8;
                              h = J[4160];
                              if (!h) {
                                break j;
                              }
                              i = 31;
                              e = (0 - g) | 0;
                              if (a >>> 0 <= 16777204) {
                                a = S((b >>> 8) | 0);
                                i =
                                  (((((g >>> (38 - a)) & 1) - (a << 1)) | 0) +
                                    62) |
                                  0;
                              }
                              b = J[((i << 2) + 16940) >> 2];
                              o: {
                                p: {
                                  q: {
                                    if (!b) {
                                      a = 0;
                                      break q;
                                    }
                                    a = 0;
                                    c =
                                      g <<
                                      ((i | 0) != 31
                                        ? (25 - ((i >>> 1) | 0)) | 0
                                        : 0);
                                    while (1) {
                                      r: {
                                        f = ((J[(b + 4) >> 2] & -8) - g) | 0;
                                        if (f >>> 0 >= e >>> 0) {
                                          break r;
                                        }
                                        d = b;
                                        e = f;
                                        if (e) {
                                          break r;
                                        }
                                        e = 0;
                                        a = b;
                                        break p;
                                      }
                                      f = J[(b + 20) >> 2];
                                      b =
                                        J[
                                          (((((c >>> 29) & 4) + b) | 0) + 16) >>
                                            2
                                        ];
                                      a = f ? ((f | 0) == (b | 0) ? a : f) : a;
                                      c = c << 1;
                                      if (b) {
                                        continue;
                                      }
                                      break;
                                    }
                                  }
                                  if (!(a | d)) {
                                    d = 0;
                                    a = 2 << i;
                                    a = ((0 - a) | a) & h;
                                    if (!a) {
                                      break j;
                                    }
                                    a = J[((ck(a) << 2) + 16940) >> 2];
                                  }
                                  if (!a) {
                                    break o;
                                  }
                                }
                                while (1) {
                                  c = ((J[(a + 4) >> 2] & -8) - g) | 0;
                                  b = c >>> 0 < e >>> 0;
                                  e = b ? c : e;
                                  d = b ? a : d;
                                  b = J[(a + 16) >> 2];
                                  if (b) {
                                    a = b;
                                  } else {
                                    a = J[(a + 20) >> 2];
                                  }
                                  if (a) {
                                    continue;
                                  }
                                  break;
                                }
                              }
                              if (!d | ((J[4161] - g) >>> 0 <= e >>> 0)) {
                                break j;
                              }
                              i = J[(d + 24) >> 2];
                              a = J[(d + 12) >> 2];
                              if ((d | 0) != (a | 0)) {
                                b = J[(d + 8) >> 2];
                                J[(b + 12) >> 2] = a;
                                J[(a + 8) >> 2] = b;
                                break c;
                              }
                              b = J[(d + 20) >> 2];
                              if (b) {
                                c = (d + 20) | 0;
                              } else {
                                b = J[(d + 16) >> 2];
                                if (!b) {
                                  break h;
                                }
                                c = (d + 16) | 0;
                              }
                              while (1) {
                                f = c;
                                a = b;
                                c = (a + 20) | 0;
                                b = J[(a + 20) >> 2];
                                if (b) {
                                  continue;
                                }
                                c = (a + 16) | 0;
                                b = J[(a + 16) >> 2];
                                if (b) {
                                  continue;
                                }
                                break;
                              }
                              J[f >> 2] = 0;
                              break c;
                            }
                            d = J[4161];
                            if (d >>> 0 >= g >>> 0) {
                              a = J[4164];
                              b = (d - g) | 0;
                              s: {
                                if (b >>> 0 >= 16) {
                                  c = (a + g) | 0;
                                  J[(c + 4) >> 2] = b | 1;
                                  J[(a + d) >> 2] = b;
                                  J[(a + 4) >> 2] = g | 3;
                                  break s;
                                }
                                J[(a + 4) >> 2] = d | 3;
                                b = (a + d) | 0;
                                J[(b + 4) >> 2] = J[(b + 4) >> 2] | 1;
                                b = 0;
                                c = 0;
                              }
                              J[4161] = b;
                              J[4164] = c;
                              a = (a + 8) | 0;
                              break a;
                            }
                            c = J[4162];
                            if (c >>> 0 > g >>> 0) {
                              b = (c - g) | 0;
                              J[4162] = b;
                              a = J[4165];
                              c = (a + g) | 0;
                              J[4165] = c;
                              J[(c + 4) >> 2] = b | 1;
                              J[(a + 4) >> 2] = g | 3;
                              a = (a + 8) | 0;
                              break a;
                            }
                            a = 0;
                            e = (g + 47) | 0;
                            if (J[4277]) {
                              b = J[4279];
                            } else {
                              J[4280] = -1;
                              J[4281] = -1;
                              J[4278] = 4096;
                              J[4279] = 4096;
                              J[4277] = ((k + 12) & -16) ^ 1431655768;
                              J[4282] = 0;
                              J[4270] = 0;
                              b = 4096;
                            }
                            f = (e + b) | 0;
                            h = (0 - b) | 0;
                            b = f & h;
                            if (b >>> 0 <= g >>> 0) {
                              break a;
                            }
                            i = J[4269];
                            if (i) {
                              j = J[4267];
                              d = (j + b) | 0;
                              if ((d >>> 0 <= j >>> 0) | (d >>> 0 > i >>> 0)) {
                                break a;
                              }
                            }
                            t: {
                              if (!(K[17080] & 4)) {
                                u: {
                                  v: {
                                    w: {
                                      x: {
                                        d = J[4165];
                                        if (d) {
                                          a = 17084;
                                          while (1) {
                                            i = J[a >> 2];
                                            if (
                                              (i >>> 0 <= d >>> 0) &
                                              (d >>> 0 <
                                                (i + J[(a + 4) >> 2]) >>> 0)
                                            ) {
                                              break x;
                                            }
                                            a = J[(a + 8) >> 2];
                                            if (a) {
                                              continue;
                                            }
                                            break;
                                          }
                                        }
                                        c = Rb(0);
                                        if ((c | 0) == -1) {
                                          break u;
                                        }
                                        f = b;
                                        a = J[4278];
                                        d = (a - 1) | 0;
                                        if (d & c) {
                                          f =
                                            (((b - c) | 0) +
                                              ((c + d) & (0 - a))) |
                                            0;
                                        }
                                        if (f >>> 0 <= g >>> 0) {
                                          break u;
                                        }
                                        d = J[4269];
                                        if (d) {
                                          h = J[4267];
                                          a = (h + f) | 0;
                                          if (
                                            (a >>> 0 <= h >>> 0) |
                                            (a >>> 0 > d >>> 0)
                                          ) {
                                            break u;
                                          }
                                        }
                                        a = Rb(f);
                                        if ((c | 0) != (a | 0)) {
                                          break w;
                                        }
                                        break t;
                                      }
                                      f = h & (f - c);
                                      c = Rb(f);
                                      if (
                                        (c | 0) ==
                                        ((J[a >> 2] + J[(a + 4) >> 2]) | 0)
                                      ) {
                                        break v;
                                      }
                                      a = c;
                                    }
                                    if ((a | 0) == -1) {
                                      break u;
                                    }
                                    if ((g + 48) >>> 0 <= f >>> 0) {
                                      c = a;
                                      break t;
                                    }
                                    c = J[4279];
                                    c = (c + ((e - f) | 0)) & (0 - c);
                                    if ((Rb(c) | 0) == -1) {
                                      break u;
                                    }
                                    f = (c + f) | 0;
                                    c = a;
                                    break t;
                                  }
                                  if ((c | 0) != -1) {
                                    break t;
                                  }
                                }
                                J[4270] = J[4270] | 4;
                              }
                              c = Rb(b);
                              a = Rb(0);
                              if (
                                ((c | 0) == -1) |
                                ((a | 0) == -1) |
                                (a >>> 0 <= c >>> 0)
                              ) {
                                break e;
                              }
                              f = (a - c) | 0;
                              if (f >>> 0 <= (g + 40) >>> 0) {
                                break e;
                              }
                            }
                            a = (J[4267] + f) | 0;
                            J[4267] = a;
                            if (a >>> 0 > M[4268]) {
                              J[4268] = a;
                            }
                            y: {
                              e = J[4165];
                              if (e) {
                                a = 17084;
                                while (1) {
                                  b = J[a >> 2];
                                  d = J[(a + 4) >> 2];
                                  if (((b + d) | 0) == (c | 0)) {
                                    break y;
                                  }
                                  a = J[(a + 8) >> 2];
                                  if (a) {
                                    continue;
                                  }
                                  break;
                                }
                                break g;
                              }
                              a = J[4163];
                              if (!(a >>> 0 <= c >>> 0 ? a : 0)) {
                                J[4163] = c;
                              }
                              a = 0;
                              J[4272] = f;
                              J[4271] = c;
                              J[4167] = -1;
                              J[4168] = J[4277];
                              J[4274] = 0;
                              while (1) {
                                b = a << 3;
                                d = (b + 16676) | 0;
                                J[(b + 16684) >> 2] = d;
                                J[(b + 16688) >> 2] = d;
                                a = (a + 1) | 0;
                                if ((a | 0) != 32) {
                                  continue;
                                }
                                break;
                              }
                              a = (f - 40) | 0;
                              b = (-8 - c) & 7;
                              d = (a - b) | 0;
                              J[4162] = d;
                              b = (b + c) | 0;
                              J[4165] = b;
                              J[(b + 4) >> 2] = d | 1;
                              J[(((a + c) | 0) + 4) >> 2] = 40;
                              J[4166] = J[4281];
                              break f;
                            }
                            if (
                              (J[(a + 12) >> 2] & 8) |
                              ((c >>> 0 <= e >>> 0) | (b >>> 0 > e >>> 0))
                            ) {
                              break g;
                            }
                            J[(a + 4) >> 2] = d + f;
                            a = (-8 - e) & 7;
                            b = (a + e) | 0;
                            J[4165] = b;
                            c = (J[4162] + f) | 0;
                            a = (c - a) | 0;
                            J[4162] = a;
                            J[(b + 4) >> 2] = a | 1;
                            J[(((c + e) | 0) + 4) >> 2] = 40;
                            J[4166] = J[4281];
                            break f;
                          }
                          a = 0;
                          break b;
                        }
                        a = 0;
                        break c;
                      }
                      if (M[4163] > c >>> 0) {
                        J[4163] = c;
                      }
                      d = (c + f) | 0;
                      a = 17084;
                      z: {
                        while (1) {
                          b = J[a >> 2];
                          if ((b | 0) != (d | 0)) {
                            a = J[(a + 8) >> 2];
                            if (a) {
                              continue;
                            }
                            break z;
                          }
                          break;
                        }
                        if (!(K[(a + 12) | 0] & 8)) {
                          break d;
                        }
                      }
                      a = 17084;
                      while (1) {
                        A: {
                          b = J[a >> 2];
                          if (b >>> 0 <= e >>> 0) {
                            d = (b + J[(a + 4) >> 2]) | 0;
                            if (d >>> 0 > e >>> 0) {
                              break A;
                            }
                          }
                          a = J[(a + 8) >> 2];
                          continue;
                        }
                        break;
                      }
                      a = (f - 40) | 0;
                      b = (-8 - c) & 7;
                      h = (a - b) | 0;
                      J[4162] = h;
                      b = (b + c) | 0;
                      J[4165] = b;
                      J[(b + 4) >> 2] = h | 1;
                      J[(((a + c) | 0) + 4) >> 2] = 40;
                      J[4166] = J[4281];
                      a = (((d + ((39 - d) & 7)) | 0) - 47) | 0;
                      b = a >>> 0 < (e + 16) >>> 0 ? e : a;
                      J[(b + 4) >> 2] = 27;
                      a = J[4274];
                      J[(b + 16) >> 2] = J[4273];
                      J[(b + 20) >> 2] = a;
                      a = J[4272];
                      J[(b + 8) >> 2] = J[4271];
                      J[(b + 12) >> 2] = a;
                      J[4273] = b + 8;
                      J[4272] = f;
                      J[4271] = c;
                      J[4274] = 0;
                      a = (b + 24) | 0;
                      while (1) {
                        J[(a + 4) >> 2] = 7;
                        c = (a + 8) | 0;
                        a = (a + 4) | 0;
                        if (c >>> 0 < d >>> 0) {
                          continue;
                        }
                        break;
                      }
                      if ((b | 0) == (e | 0)) {
                        break f;
                      }
                      J[(b + 4) >> 2] = J[(b + 4) >> 2] & -2;
                      c = (b - e) | 0;
                      J[(e + 4) >> 2] = c | 1;
                      J[b >> 2] = c;
                      B: {
                        if (c >>> 0 <= 255) {
                          a = ((c & 248) + 16676) | 0;
                          b = J[4159];
                          c = 1 << (c >>> 3);
                          C: {
                            if (!(b & c)) {
                              J[4159] = b | c;
                              b = a;
                              break C;
                            }
                            b = J[(a + 8) >> 2];
                          }
                          J[(a + 8) >> 2] = e;
                          J[(b + 12) >> 2] = e;
                          d = 8;
                          c = 12;
                          break B;
                        }
                        a = 31;
                        if (c >>> 0 <= 16777215) {
                          a = S((c >>> 8) | 0);
                          a = (((c >>> (38 - a)) & 1) | (a << 1)) ^ 62;
                        }
                        J[(e + 28) >> 2] = a;
                        J[(e + 16) >> 2] = 0;
                        J[(e + 20) >> 2] = 0;
                        b = ((a << 2) + 16940) | 0;
                        D: {
                          d = J[4160];
                          f = 1 << a;
                          E: {
                            if (!(d & f)) {
                              J[4160] = d | f;
                              J[b >> 2] = e;
                              break E;
                            }
                            a =
                              c <<
                              ((a | 0) != 31 ? (25 - ((a >>> 1) | 0)) | 0 : 0);
                            d = J[b >> 2];
                            while (1) {
                              b = d;
                              if ((c | 0) == (J[(b + 4) >> 2] & -8)) {
                                break D;
                              }
                              d = (a >>> 29) | 0;
                              a = a << 1;
                              f = ((d & 4) + b) | 0;
                              d = J[(f + 16) >> 2];
                              if (d) {
                                continue;
                              }
                              break;
                            }
                            J[(f + 16) >> 2] = e;
                          }
                          J[(e + 24) >> 2] = b;
                          b = e;
                          a = b;
                          d = 12;
                          c = 8;
                          break B;
                        }
                        a = J[(b + 8) >> 2];
                        J[(a + 12) >> 2] = e;
                        J[(b + 8) >> 2] = e;
                        J[(e + 8) >> 2] = a;
                        a = 0;
                        d = 12;
                        c = 24;
                      }
                      J[(e + d) >> 2] = b;
                      J[(c + e) >> 2] = a;
                    }
                    a = J[4162];
                    if (a >>> 0 <= g >>> 0) {
                      break e;
                    }
                    b = (a - g) | 0;
                    J[4162] = b;
                    a = J[4165];
                    c = (a + g) | 0;
                    J[4165] = c;
                    J[(c + 4) >> 2] = b | 1;
                    J[(a + 4) >> 2] = g | 3;
                    a = (a + 8) | 0;
                    break a;
                  }
                  J[4158] = 48;
                  a = 0;
                  break a;
                }
                J[a >> 2] = c;
                J[(a + 4) >> 2] = J[(a + 4) >> 2] + f;
                i = (((-8 - c) & 7) + c) | 0;
                J[(i + 4) >> 2] = g | 3;
                f = (b + ((-8 - b) & 7)) | 0;
                e = (g + i) | 0;
                h = (f - e) | 0;
                F: {
                  if (J[4165] == (f | 0)) {
                    J[4165] = e;
                    a = (J[4162] + h) | 0;
                    J[4162] = a;
                    J[(e + 4) >> 2] = a | 1;
                    break F;
                  }
                  if (J[4164] == (f | 0)) {
                    J[4164] = e;
                    a = (J[4161] + h) | 0;
                    J[4161] = a;
                    J[(e + 4) >> 2] = a | 1;
                    J[(a + e) >> 2] = a;
                    break F;
                  }
                  a = J[(f + 4) >> 2];
                  if ((a & 3) == 1) {
                    j = a & -8;
                    c = J[(f + 12) >> 2];
                    G: {
                      if (a >>> 0 <= 255) {
                        b = J[(f + 8) >> 2];
                        if ((b | 0) == (c | 0)) {
                          ((m = 16636),
                            (n = J[4159] & fk(-2, (a >>> 3) | 0)),
                            (J[m >> 2] = n));
                          break G;
                        }
                        J[(b + 12) >> 2] = c;
                        J[(c + 8) >> 2] = b;
                        break G;
                      }
                      g = J[(f + 24) >> 2];
                      H: {
                        if ((c | 0) != (f | 0)) {
                          a = J[(f + 8) >> 2];
                          J[(a + 12) >> 2] = c;
                          J[(c + 8) >> 2] = a;
                          break H;
                        }
                        I: {
                          a = J[(f + 20) >> 2];
                          if (a) {
                            b = (f + 20) | 0;
                          } else {
                            a = J[(f + 16) >> 2];
                            if (!a) {
                              break I;
                            }
                            b = (f + 16) | 0;
                          }
                          while (1) {
                            d = b;
                            c = a;
                            b = (a + 20) | 0;
                            a = J[(a + 20) >> 2];
                            if (a) {
                              continue;
                            }
                            b = (c + 16) | 0;
                            a = J[(c + 16) >> 2];
                            if (a) {
                              continue;
                            }
                            break;
                          }
                          J[d >> 2] = 0;
                          break H;
                        }
                        c = 0;
                      }
                      if (!g) {
                        break G;
                      }
                      a = J[(f + 28) >> 2];
                      b = a << 2;
                      J: {
                        if (J[(b + 16940) >> 2] == (f | 0)) {
                          J[(b + 16940) >> 2] = c;
                          if (c) {
                            break J;
                          }
                          ((m = 16640),
                            (n = J[4160] & fk(-2, a)),
                            (J[m >> 2] = n));
                          break G;
                        }
                        K: {
                          if (J[(g + 16) >> 2] == (f | 0)) {
                            J[(g + 16) >> 2] = c;
                            break K;
                          }
                          J[(g + 20) >> 2] = c;
                        }
                        if (!c) {
                          break G;
                        }
                      }
                      J[(c + 24) >> 2] = g;
                      a = J[(f + 16) >> 2];
                      if (a) {
                        J[(c + 16) >> 2] = a;
                        J[(a + 24) >> 2] = c;
                      }
                      a = J[(f + 20) >> 2];
                      if (!a) {
                        break G;
                      }
                      J[(c + 20) >> 2] = a;
                      J[(a + 24) >> 2] = c;
                    }
                    h = (h + j) | 0;
                    f = (f + j) | 0;
                    a = J[(f + 4) >> 2];
                  }
                  J[(f + 4) >> 2] = a & -2;
                  J[(e + 4) >> 2] = h | 1;
                  J[(e + h) >> 2] = h;
                  if (h >>> 0 <= 255) {
                    a = ((h & 248) + 16676) | 0;
                    b = J[4159];
                    c = 1 << (h >>> 3);
                    L: {
                      if (!(b & c)) {
                        J[4159] = b | c;
                        b = a;
                        break L;
                      }
                      b = J[(a + 8) >> 2];
                    }
                    J[(a + 8) >> 2] = e;
                    J[(b + 12) >> 2] = e;
                    J[(e + 12) >> 2] = a;
                    J[(e + 8) >> 2] = b;
                    break F;
                  }
                  c = 31;
                  if (h >>> 0 <= 16777215) {
                    a = S((h >>> 8) | 0);
                    c = (((h >>> (38 - a)) & 1) | (a << 1)) ^ 62;
                  }
                  J[(e + 28) >> 2] = c;
                  J[(e + 16) >> 2] = 0;
                  J[(e + 20) >> 2] = 0;
                  a = ((c << 2) + 16940) | 0;
                  M: {
                    b = J[4160];
                    d = 1 << c;
                    N: {
                      if (!(b & d)) {
                        J[4160] = b | d;
                        J[a >> 2] = e;
                        break N;
                      }
                      c = h << ((c | 0) != 31 ? (25 - ((c >>> 1) | 0)) | 0 : 0);
                      b = J[a >> 2];
                      while (1) {
                        a = b;
                        if ((J[(a + 4) >> 2] & -8) == (h | 0)) {
                          break M;
                        }
                        b = (c >>> 29) | 0;
                        c = c << 1;
                        d = ((b & 4) + a) | 0;
                        b = J[(d + 16) >> 2];
                        if (b) {
                          continue;
                        }
                        break;
                      }
                      J[(d + 16) >> 2] = e;
                    }
                    J[(e + 24) >> 2] = a;
                    J[(e + 12) >> 2] = e;
                    J[(e + 8) >> 2] = e;
                    break F;
                  }
                  b = J[(a + 8) >> 2];
                  J[(b + 12) >> 2] = e;
                  J[(a + 8) >> 2] = e;
                  J[(e + 24) >> 2] = 0;
                  J[(e + 12) >> 2] = a;
                  J[(e + 8) >> 2] = b;
                }
                a = (i + 8) | 0;
                break a;
              }
              O: {
                if (!i) {
                  break O;
                }
                b = J[(d + 28) >> 2];
                c = b << 2;
                P: {
                  if (J[(c + 16940) >> 2] == (d | 0)) {
                    J[(c + 16940) >> 2] = a;
                    if (a) {
                      break P;
                    }
                    h = fk(-2, b) & h;
                    J[4160] = h;
                    break O;
                  }
                  Q: {
                    if (J[(i + 16) >> 2] == (d | 0)) {
                      J[(i + 16) >> 2] = a;
                      break Q;
                    }
                    J[(i + 20) >> 2] = a;
                  }
                  if (!a) {
                    break O;
                  }
                }
                J[(a + 24) >> 2] = i;
                b = J[(d + 16) >> 2];
                if (b) {
                  J[(a + 16) >> 2] = b;
                  J[(b + 24) >> 2] = a;
                }
                b = J[(d + 20) >> 2];
                if (!b) {
                  break O;
                }
                J[(a + 20) >> 2] = b;
                J[(b + 24) >> 2] = a;
              }
              R: {
                if (e >>> 0 <= 15) {
                  a = (e + g) | 0;
                  J[(d + 4) >> 2] = a | 3;
                  a = (a + d) | 0;
                  J[(a + 4) >> 2] = J[(a + 4) >> 2] | 1;
                  break R;
                }
                J[(d + 4) >> 2] = g | 3;
                f = (d + g) | 0;
                J[(f + 4) >> 2] = e | 1;
                J[(e + f) >> 2] = e;
                if (e >>> 0 <= 255) {
                  a = ((e & 248) + 16676) | 0;
                  b = J[4159];
                  c = 1 << (e >>> 3);
                  S: {
                    if (!(b & c)) {
                      J[4159] = b | c;
                      b = a;
                      break S;
                    }
                    b = J[(a + 8) >> 2];
                  }
                  J[(a + 8) >> 2] = f;
                  J[(b + 12) >> 2] = f;
                  J[(f + 12) >> 2] = a;
                  J[(f + 8) >> 2] = b;
                  break R;
                }
                a = 31;
                if (e >>> 0 <= 16777215) {
                  a = S((e >>> 8) | 0);
                  a = (((e >>> (38 - a)) & 1) | (a << 1)) ^ 62;
                }
                J[(f + 28) >> 2] = a;
                J[(f + 16) >> 2] = 0;
                J[(f + 20) >> 2] = 0;
                b = ((a << 2) + 16940) | 0;
                T: {
                  c = 1 << a;
                  U: {
                    if (!(c & h)) {
                      J[4160] = c | h;
                      J[b >> 2] = f;
                      J[(f + 24) >> 2] = b;
                      break U;
                    }
                    a = e << ((a | 0) != 31 ? (25 - ((a >>> 1) | 0)) | 0 : 0);
                    b = J[b >> 2];
                    while (1) {
                      c = b;
                      if ((J[(b + 4) >> 2] & -8) == (e | 0)) {
                        break T;
                      }
                      h = (a >>> 29) | 0;
                      a = a << 1;
                      h = (b + (h & 4)) | 0;
                      b = J[(h + 16) >> 2];
                      if (b) {
                        continue;
                      }
                      break;
                    }
                    J[(h + 16) >> 2] = f;
                    J[(f + 24) >> 2] = c;
                  }
                  J[(f + 12) >> 2] = f;
                  J[(f + 8) >> 2] = f;
                  break R;
                }
                a = J[(c + 8) >> 2];
                J[(a + 12) >> 2] = f;
                J[(c + 8) >> 2] = f;
                J[(f + 24) >> 2] = 0;
                J[(f + 12) >> 2] = c;
                J[(f + 8) >> 2] = a;
              }
              a = (d + 8) | 0;
              break a;
            }
            V: {
              if (!j) {
                break V;
              }
              b = J[(c + 28) >> 2];
              d = b << 2;
              W: {
                if (J[(d + 16940) >> 2] == (c | 0)) {
                  J[(d + 16940) >> 2] = a;
                  if (a) {
                    break W;
                  }
                  ((m = 16640), (n = fk(-2, b) & l), (J[m >> 2] = n));
                  break V;
                }
                X: {
                  if (J[(j + 16) >> 2] == (c | 0)) {
                    J[(j + 16) >> 2] = a;
                    break X;
                  }
                  J[(j + 20) >> 2] = a;
                }
                if (!a) {
                  break V;
                }
              }
              J[(a + 24) >> 2] = j;
              b = J[(c + 16) >> 2];
              if (b) {
                J[(a + 16) >> 2] = b;
                J[(b + 24) >> 2] = a;
              }
              b = J[(c + 20) >> 2];
              if (!b) {
                break V;
              }
              J[(a + 20) >> 2] = b;
              J[(b + 24) >> 2] = a;
            }
            Y: {
              if (e >>> 0 <= 15) {
                a = (e + g) | 0;
                J[(c + 4) >> 2] = a | 3;
                a = (a + c) | 0;
                J[(a + 4) >> 2] = J[(a + 4) >> 2] | 1;
                break Y;
              }
              J[(c + 4) >> 2] = g | 3;
              h = (c + g) | 0;
              J[(h + 4) >> 2] = e | 1;
              J[(e + h) >> 2] = e;
              if (i) {
                a = ((i & -8) + 16676) | 0;
                d = J[4164];
                b = 1 << (i >>> 3);
                Z: {
                  if (!(b & f)) {
                    J[4159] = b | f;
                    b = a;
                    break Z;
                  }
                  b = J[(a + 8) >> 2];
                }
                J[(a + 8) >> 2] = d;
                J[(b + 12) >> 2] = d;
                J[(d + 12) >> 2] = a;
                J[(d + 8) >> 2] = b;
              }
              J[4164] = h;
              J[4161] = e;
            }
            a = (c + 8) | 0;
          }
          ka = (k + 16) | 0;
          return a | 0;
        }
        function Le(a, b, c) {
          var d = 0,
            e = 0,
            f = 0,
            g = 0,
            h = 0,
            i = 0,
            j = 0,
            k = 0,
            l = 0,
            m = 0,
            n = 0,
            o = 0,
            p = 0,
            q = 0,
            r = 0,
            s = 0,
            t = 0,
            u = 0,
            v = 0,
            w = 0,
            x = 0,
            y = 0,
            z = 0,
            A = Q(0),
            B = 0;
          u = (ka - 16) | 0;
          ka = u;
          J[(u + 12) >> 2] = c;
          ((y = u), (z = tb(b)), (J[(y + 8) >> 2] = z));
          v = J[(u + 12) >> 2];
          d = (ka - 144) | 0;
          ka = d;
          D(d, 0, 144);
          J[(d + 76) >> 2] = -1;
          J[(d + 44) >> 2] = a;
          J[(d + 32) >> 2] = 262;
          J[(d + 84) >> 2] = a;
          e = 1657;
          h = (ka - 304) | 0;
          ka = h;
          a: {
            b: {
              if (!J[(d + 4) >> 2]) {
                hc(d);
                if (!J[(d + 4) >> 2]) {
                  break b;
                }
              }
              b = K[1657];
              if (!b) {
                break a;
              }
              c: {
                d: {
                  while (1) {
                    e: {
                      a = b & 255;
                      f: {
                        if (yb(a)) {
                          while (1) {
                            b = e;
                            e = (e + 1) | 0;
                            if (yb(K[(b + 1) | 0])) {
                              continue;
                            }
                            break;
                          }
                          hb(d, 0, 0);
                          while (1) {
                            a = J[(d + 4) >> 2];
                            g: {
                              if ((a | 0) != J[(d + 104) >> 2]) {
                                J[(d + 4) >> 2] = a + 1;
                                a = K[a | 0];
                                break g;
                              }
                              a = Ca(d);
                            }
                            if (yb(a)) {
                              continue;
                            }
                            break;
                          }
                          e = J[(d + 4) >> 2];
                          a = J[(d + 116) >> 2];
                          if ((a | 0) > 0) {
                            a = 1;
                          } else {
                            a = (a | 0) >= 0;
                          }
                          if (a) {
                            e = (e - 1) | 0;
                            J[(d + 4) >> 2] = e;
                          }
                          a = (e - J[(d + 44) >> 2]) | 0;
                          c = a;
                          f = a >> 31;
                          a = (s + J[(d + 124) >> 2]) | 0;
                          g = (a + 1) | 0;
                          e = a;
                          a = (l + J[(d + 120) >> 2]) | 0;
                          f = (f + (a >>> 0 < l >>> 0 ? g : e)) | 0;
                          l = (a + c) | 0;
                          s = l >>> 0 < a >>> 0 ? (f + 1) | 0 : f;
                          break f;
                        }
                        h: {
                          i: {
                            j: {
                              if ((a | 0) == 37) {
                                a = K[(e + 1) | 0];
                                if ((a | 0) == 42) {
                                  break j;
                                }
                                if ((a | 0) != 37) {
                                  break i;
                                }
                              }
                              hb(d, 0, 0);
                              k: {
                                if (K[e | 0] == 37) {
                                  while (1) {
                                    a = J[(d + 4) >> 2];
                                    l: {
                                      if ((a | 0) != J[(d + 104) >> 2]) {
                                        J[(d + 4) >> 2] = a + 1;
                                        b = K[a | 0];
                                        break l;
                                      }
                                      b = Ca(d);
                                    }
                                    if (yb(b)) {
                                      continue;
                                    }
                                    break;
                                  }
                                  e = (e + 1) | 0;
                                  break k;
                                }
                                a = J[(d + 4) >> 2];
                                if ((a | 0) != J[(d + 104) >> 2]) {
                                  J[(d + 4) >> 2] = a + 1;
                                  b = K[a | 0];
                                  break k;
                                }
                                b = Ca(d);
                              }
                              if (K[e | 0] != (b | 0)) {
                                a = J[(d + 116) >> 2];
                                if ((a | 0) > 0) {
                                  a = 1;
                                } else {
                                  a = (a | 0) >= 0;
                                }
                                if (a) {
                                  J[(d + 4) >> 2] = J[(d + 4) >> 2] - 1;
                                }
                                if (((b | 0) >= 0) | t) {
                                  break a;
                                }
                                break b;
                              }
                              a = (J[(d + 4) >> 2] - J[(d + 44) >> 2]) | 0;
                              b = a;
                              f = a >> 31;
                              a = (s + J[(d + 124) >> 2]) | 0;
                              g = (a + 1) | 0;
                              c = a;
                              a = (l + J[(d + 120) >> 2]) | 0;
                              c = (f + (a >>> 0 < l >>> 0 ? g : c)) | 0;
                              l = (a + b) | 0;
                              s = l >>> 0 < a >>> 0 ? (c + 1) | 0 : c;
                              b = e;
                              break f;
                            }
                            k = 0;
                            b = (e + 2) | 0;
                            break h;
                          }
                          a = (a - 48) | 0;
                          if (!((K[(e + 2) | 0] != 36) | (a >>> 0 > 9))) {
                            b = (ka - 16) | 0;
                            J[(b + 12) >> 2] = v;
                            a =
                              a >>> 0 > 1 ? ((((a << 2) + v) | 0) - 4) | 0 : v;
                            J[(b + 8) >> 2] = a + 4;
                            k = J[a >> 2];
                            b = (e + 3) | 0;
                            break h;
                          }
                          k = J[v >> 2];
                          v = (v + 4) | 0;
                          b = (e + 1) | 0;
                        }
                        r = 0;
                        c = 0;
                        e = K[b | 0];
                        if (((e - 48) & 255) >>> 0 <= 9) {
                          while (1) {
                            c = (((P(c, 10) + (e & 255)) | 0) - 48) | 0;
                            e = K[(b + 1) | 0];
                            b = (b + 1) | 0;
                            if (((e - 48) & 255) >>> 0 < 10) {
                              continue;
                            }
                            break;
                          }
                        }
                        if ((e & 255) == 109) {
                          n = 0;
                          r = (k | 0) != 0;
                          e = K[(b + 1) | 0];
                          o = 0;
                          b = (b + 1) | 0;
                        }
                        f = b;
                        b = (f + 1) | 0;
                        a = 3;
                        m: {
                          n: {
                            switch (((e & 255) - 65) | 0) {
                              case 39:
                                a = K[(f + 1) | 0] == 104;
                                b = a ? (f + 2) | 0 : b;
                                a = a ? -2 : -1;
                                break m;
                              case 43:
                                a = K[(f + 1) | 0] == 108;
                                b = a ? (f + 2) | 0 : b;
                                a = a ? 3 : 1;
                                break m;
                              case 51:
                              case 57:
                                a = 1;
                                break m;
                              case 11:
                                a = 2;
                                break m;
                              case 0:
                              case 2:
                              case 4:
                              case 5:
                              case 6:
                              case 18:
                              case 23:
                              case 26:
                              case 32:
                              case 34:
                              case 35:
                              case 36:
                              case 37:
                              case 38:
                              case 40:
                              case 45:
                              case 46:
                              case 47:
                              case 50:
                              case 52:
                              case 55:
                                break n;
                              case 41:
                                break m;
                              default:
                                break d;
                            }
                          }
                          a = 0;
                          b = f;
                        }
                        e = a;
                        a = K[b | 0];
                        f = (a & 47) == 3;
                        w = f ? 1 : e;
                        q = f ? a | 32 : a;
                        o: {
                          if ((q | 0) == 91) {
                            break o;
                          }
                          p: {
                            if ((q | 0) != 110) {
                              if ((q | 0) != 99) {
                                break p;
                              }
                              c = (c | 0) <= 1 ? 1 : c;
                              break o;
                            }
                            Ze(k, w, l, s);
                            break f;
                          }
                          hb(d, 0, 0);
                          while (1) {
                            a = J[(d + 4) >> 2];
                            q: {
                              if ((a | 0) != J[(d + 104) >> 2]) {
                                J[(d + 4) >> 2] = a + 1;
                                a = K[a | 0];
                                break q;
                              }
                              a = Ca(d);
                            }
                            if (yb(a)) {
                              continue;
                            }
                            break;
                          }
                          e = J[(d + 4) >> 2];
                          a = J[(d + 116) >> 2];
                          if ((a | 0) > 0) {
                            a = 1;
                          } else {
                            a = (a | 0) >= 0;
                          }
                          if (a) {
                            e = (e - 1) | 0;
                            J[(d + 4) >> 2] = e;
                          }
                          a = (e - J[(d + 44) >> 2]) | 0;
                          f = a;
                          g = a >> 31;
                          a = (s + J[(d + 124) >> 2]) | 0;
                          j = (a + 1) | 0;
                          e = a;
                          a = (l + J[(d + 120) >> 2]) | 0;
                          e = (g + (a >>> 0 < l >>> 0 ? j : e)) | 0;
                          l = (a + f) | 0;
                          s = l >>> 0 < a >>> 0 ? (e + 1) | 0 : e;
                        }
                        j = c;
                        m = c >> 31;
                        hb(d, c, m);
                        a = J[(d + 4) >> 2];
                        r: {
                          if ((a | 0) != J[(d + 104) >> 2]) {
                            J[(d + 4) >> 2] = a + 1;
                            break r;
                          }
                          if ((Ca(d) | 0) < 0) {
                            break d;
                          }
                        }
                        a = J[(d + 116) >> 2];
                        if ((a | 0) > 0) {
                          a = 1;
                        } else {
                          a = (a | 0) >= 0;
                        }
                        if (a) {
                          J[(d + 4) >> 2] = J[(d + 4) >> 2] - 1;
                        }
                        e = 16;
                        s: {
                          t: {
                            u: {
                              v: {
                                w: {
                                  x: {
                                    y: {
                                      switch ((q - 88) | 0) {
                                        default:
                                          a = (q - 65) | 0;
                                          if (
                                            (a >>> 0 > 6) |
                                            !((1 << a) & 113)
                                          ) {
                                            break s;
                                          }
                                        case 9:
                                        case 13:
                                        case 14:
                                        case 15:
                                          af((h + 8) | 0, d, w, 0);
                                          a =
                                            (J[(d + 4) >> 2] -
                                              J[(d + 44) >> 2]) |
                                            0;
                                          if (
                                            (J[(d + 120) >> 2] ==
                                              ((0 - a) | 0)) &
                                            (J[(d + 124) >> 2] ==
                                              ((0 -
                                                (((a >> 31) + ((a | 0) != 0)) |
                                                  0)) |
                                                0))
                                          ) {
                                            break c;
                                          }
                                          if (!k) {
                                            break s;
                                          }
                                          a = J[(h + 16) >> 2];
                                          c = J[(h + 20) >> 2];
                                          f = J[(h + 8) >> 2];
                                          e = J[(h + 12) >> 2];
                                          switch (w | 0) {
                                            case 0:
                                              break w;
                                            case 1:
                                              break v;
                                            case 2:
                                              break u;
                                            default:
                                              break s;
                                          }
                                        case 3:
                                        case 11:
                                        case 27:
                                          if ((q | 16) == 115) {
                                            wd((h + 32) | 0, -1, 257);
                                            H[(h + 32) | 0] = 0;
                                            if ((q | 0) != 115) {
                                              break t;
                                            }
                                            H[(h + 65) | 0] = 0;
                                            H[(h + 46) | 0] = 0;
                                            I[(h + 42) >> 1] = 0;
                                            I[(h + 44) >> 1] = 0;
                                            break t;
                                          }
                                          a = K[(b + 1) | 0];
                                          f = (a | 0) == 94;
                                          wd((h + 32) | 0, f, 257);
                                          H[(h + 32) | 0] = 0;
                                          e = f ? (b + 2) | 0 : (b + 1) | 0;
                                          z: {
                                            A: {
                                              B: {
                                                b = K[((f ? 2 : 1) + b) | 0];
                                                if ((b | 0) != 45) {
                                                  if ((b | 0) == 93) {
                                                    break B;
                                                  }
                                                  i = (a | 0) != 94;
                                                  b = e;
                                                  break z;
                                                }
                                                i = (a | 0) != 94;
                                                H[(h + 78) | 0] = i;
                                                break A;
                                              }
                                              i = (a | 0) != 94;
                                              H[(h + 126) | 0] = i;
                                            }
                                            b = (e + 1) | 0;
                                          }
                                          while (1) {
                                            a = K[b | 0];
                                            C: {
                                              if ((a | 0) != 45) {
                                                if (!a) {
                                                  break d;
                                                }
                                                if ((a | 0) == 93) {
                                                  break t;
                                                }
                                                break C;
                                              }
                                              a = 45;
                                              f = K[(b + 1) | 0];
                                              if (!f | ((f | 0) == 93)) {
                                                break C;
                                              }
                                              g = (b + 1) | 0;
                                              e = K[(b - 1) | 0];
                                              D: {
                                                if (f >>> 0 <= e >>> 0) {
                                                  a = f;
                                                  break D;
                                                }
                                                while (1) {
                                                  e = (e + 1) | 0;
                                                  H[(e + ((h + 32) | 0)) | 0] =
                                                    i;
                                                  a = K[g | 0];
                                                  if (e >>> 0 < a >>> 0) {
                                                    continue;
                                                  }
                                                  break;
                                                }
                                              }
                                              b = g;
                                            }
                                            H[
                                              (((((h + 32) | 0) + a) | 0) + 1) |
                                                0
                                            ] = i;
                                            b = (b + 1) | 0;
                                            continue;
                                          }
                                        case 23:
                                          e = 8;
                                          break x;
                                        case 12:
                                        case 29:
                                          e = 10;
                                          break x;
                                        case 0:
                                        case 24:
                                        case 32:
                                          break x;
                                        case 1:
                                        case 2:
                                        case 4:
                                        case 5:
                                        case 6:
                                        case 7:
                                        case 8:
                                        case 10:
                                        case 16:
                                        case 18:
                                        case 19:
                                        case 20:
                                        case 21:
                                        case 22:
                                        case 25:
                                        case 26:
                                        case 28:
                                        case 30:
                                        case 31:
                                          break s;
                                        case 17:
                                          break y;
                                      }
                                    }
                                    e = 0;
                                  }
                                  f = 0;
                                  j = 0;
                                  c = 0;
                                  g = 0;
                                  i = 0;
                                  x = (ka - 16) | 0;
                                  ka = x;
                                  E: {
                                    if (!(((e | 0) != 1) & (e >>> 0 <= 36))) {
                                      J[4158] = 28;
                                      break E;
                                    }
                                    while (1) {
                                      a = J[(d + 4) >> 2];
                                      F: {
                                        if ((a | 0) != J[(d + 104) >> 2]) {
                                          J[(d + 4) >> 2] = a + 1;
                                          a = K[a | 0];
                                          break F;
                                        }
                                        a = Ca(d);
                                      }
                                      if (yb(a)) {
                                        continue;
                                      }
                                      break;
                                    }
                                    G: {
                                      H: {
                                        switch ((a - 43) | 0) {
                                          case 0:
                                          case 2:
                                            break H;
                                          default:
                                            break G;
                                        }
                                      }
                                      i = (a | 0) == 45 ? -1 : 0;
                                      a = J[(d + 4) >> 2];
                                      if ((a | 0) != J[(d + 104) >> 2]) {
                                        J[(d + 4) >> 2] = a + 1;
                                        a = K[a | 0];
                                        break G;
                                      }
                                      a = Ca(d);
                                    }
                                    I: {
                                      J: {
                                        K: {
                                          L: {
                                            if (
                                              !(
                                                (((e | 0) != 0) &
                                                  ((e | 0) != 16)) |
                                                ((a | 0) != 48)
                                              )
                                            ) {
                                              a = J[(d + 4) >> 2];
                                              M: {
                                                if (
                                                  (a | 0) !=
                                                  J[(d + 104) >> 2]
                                                ) {
                                                  J[(d + 4) >> 2] = a + 1;
                                                  a = K[a | 0];
                                                  break M;
                                                }
                                                a = Ca(d);
                                              }
                                              if ((a & -33) == 88) {
                                                e = 16;
                                                a = J[(d + 4) >> 2];
                                                N: {
                                                  if (
                                                    (a | 0) !=
                                                    J[(d + 104) >> 2]
                                                  ) {
                                                    J[(d + 4) >> 2] = a + 1;
                                                    a = K[a | 0];
                                                    break N;
                                                  }
                                                  a = Ca(d);
                                                }
                                                if (K[(a + 7249) | 0] < 16) {
                                                  break K;
                                                }
                                                a = J[(d + 116) >> 2];
                                                if ((a | 0) > 0) {
                                                  a = 1;
                                                } else {
                                                  a = (a | 0) >= 0;
                                                }
                                                if (a) {
                                                  J[(d + 4) >> 2] =
                                                    J[(d + 4) >> 2] - 1;
                                                }
                                                hb(d, 0, 0);
                                                break E;
                                              }
                                              if (e) {
                                                break L;
                                              }
                                              e = 8;
                                              break K;
                                            }
                                            e = e ? e : 10;
                                            if (e >>> 0 > K[(a + 7249) | 0]) {
                                              break L;
                                            }
                                            a = J[(d + 116) >> 2];
                                            if ((a | 0) > 0) {
                                              a = 1;
                                            } else {
                                              a = (a | 0) >= 0;
                                            }
                                            if (a) {
                                              J[(d + 4) >> 2] =
                                                J[(d + 4) >> 2] - 1;
                                            }
                                            hb(d, 0, 0);
                                            J[4158] = 28;
                                            break E;
                                          }
                                          if ((e | 0) != 10) {
                                            break K;
                                          }
                                          c = (a - 48) | 0;
                                          if (c >>> 0 <= 9) {
                                            a = 0;
                                            while (1) {
                                              a = (P(a, 10) + c) | 0;
                                              e = a >>> 0 < 429496729;
                                              c = J[(d + 4) >> 2];
                                              O: {
                                                if (
                                                  (c | 0) !=
                                                  J[(d + 104) >> 2]
                                                ) {
                                                  J[(d + 4) >> 2] = c + 1;
                                                  c = K[c | 0];
                                                  break O;
                                                }
                                                c = Ca(d);
                                              }
                                              c = (c - 48) | 0;
                                              if (e & (c >>> 0 <= 9)) {
                                                continue;
                                              }
                                              break;
                                            }
                                            f = a;
                                          }
                                          if (c >>> 0 > 9) {
                                            break I;
                                          }
                                          e = dk(f, 0, 10, 0);
                                          g = na;
                                          while (1) {
                                            P: {
                                              f = (c + e) | 0;
                                              j =
                                                f >>> 0 < c >>> 0
                                                  ? (g + 1) | 0
                                                  : g;
                                              e =
                                                (((j | 0) == 429496729) &
                                                  (f >>> 0 < 2576980378)) |
                                                (j >>> 0 < 429496729);
                                              a = J[(d + 4) >> 2];
                                              Q: {
                                                if (
                                                  (a | 0) !=
                                                  J[(d + 104) >> 2]
                                                ) {
                                                  J[(d + 4) >> 2] = a + 1;
                                                  a = K[a | 0];
                                                  break Q;
                                                }
                                                a = Ca(d);
                                              }
                                              c = (a - 48) | 0;
                                              if (!(e & (c >>> 0 <= 9))) {
                                                if (c >>> 0 <= 9) {
                                                  break P;
                                                }
                                                break I;
                                              }
                                              e = dk(f, j, 10, 0);
                                              g = na;
                                              if (
                                                (((g | 0) == -1) &
                                                  ((c ^ -1) >>> 0 >= e >>> 0)) |
                                                ((g | 0) != -1)
                                              ) {
                                                continue;
                                              }
                                            }
                                            break;
                                          }
                                          e = 10;
                                          break J;
                                        }
                                        R: {
                                          S: {
                                            if ((e - 1) & e) {
                                              g = K[(a + 7249) | 0];
                                              if (g >>> 0 < e >>> 0) {
                                                break S;
                                              }
                                              break R;
                                            }
                                            c = K[(a + 7249) | 0];
                                            if (e >>> 0 <= c >>> 0) {
                                              break R;
                                            }
                                            m =
                                              H[
                                                (((P(e, 23) >>> 5) & 7) +
                                                  7505) |
                                                  0
                                              ];
                                            while (1) {
                                              f = g << m;
                                              g = f | c;
                                              a = J[(d + 4) >> 2];
                                              T: {
                                                if (
                                                  (a | 0) !=
                                                  J[(d + 104) >> 2]
                                                ) {
                                                  J[(d + 4) >> 2] = a + 1;
                                                  a = K[a | 0];
                                                  break T;
                                                }
                                                a = Ca(d);
                                              }
                                              c = K[(a + 7249) | 0];
                                              p = e >>> 0 <= c >>> 0;
                                              if (!p & (f >>> 0 < 134217728)) {
                                                continue;
                                              }
                                              break;
                                            }
                                            f = g;
                                            if (p) {
                                              break J;
                                            }
                                            p = m & 31;
                                            if ((m & 63) >>> 0 >= 32) {
                                              g = 0;
                                              p = (-1 >>> p) | 0;
                                            } else {
                                              g = (-1 >>> p) | 0;
                                              p =
                                                g |
                                                (((1 << p) - 1) << (32 - p));
                                            }
                                            if (!g & (f >>> 0 > p >>> 0)) {
                                              break J;
                                            }
                                            while (1) {
                                              a = m & 31;
                                              if ((m & 63) >>> 0 >= 32) {
                                                j = f << a;
                                                a = 0;
                                              } else {
                                                j =
                                                  (((1 << a) - 1) &
                                                    (f >>> (32 - a))) |
                                                  (j << a);
                                                a = f << a;
                                              }
                                              f = a | (c & 255);
                                              a = J[(d + 4) >> 2];
                                              U: {
                                                if (
                                                  (a | 0) !=
                                                  J[(d + 104) >> 2]
                                                ) {
                                                  J[(d + 4) >> 2] = a + 1;
                                                  a = K[a | 0];
                                                  break U;
                                                }
                                                a = Ca(d);
                                              }
                                              c = K[(a + 7249) | 0];
                                              if (e >>> 0 <= c >>> 0) {
                                                break J;
                                              }
                                              if (
                                                (((g | 0) == (j | 0)) &
                                                  (f >>> 0 <= p >>> 0)) |
                                                (g >>> 0 > j >>> 0)
                                              ) {
                                                continue;
                                              }
                                              break;
                                            }
                                            break J;
                                          }
                                          while (1) {
                                            c = (P(c, e) + g) | 0;
                                            a = J[(d + 4) >> 2];
                                            V: {
                                              if (
                                                (a | 0) !=
                                                J[(d + 104) >> 2]
                                              ) {
                                                J[(d + 4) >> 2] = a + 1;
                                                a = K[a | 0];
                                                break V;
                                              }
                                              a = Ca(d);
                                            }
                                            g = K[(a + 7249) | 0];
                                            m = e >>> 0 <= g >>> 0;
                                            if (!m & (c >>> 0 < 119304647)) {
                                              continue;
                                            }
                                            break;
                                          }
                                          f = c;
                                          if (m) {
                                            break J;
                                          }
                                          while (1) {
                                            c = dk(f, j, e, 0);
                                            m = na;
                                            g = g & 255;
                                            if (
                                              ((m | 0) == -1) &
                                              ((g ^ -1) >>> 0 < c >>> 0)
                                            ) {
                                              break J;
                                            }
                                            f = (c + g) | 0;
                                            j =
                                              f >>> 0 < g >>> 0
                                                ? (m + 1) | 0
                                                : m;
                                            a = J[(d + 4) >> 2];
                                            W: {
                                              if (
                                                (a | 0) !=
                                                J[(d + 104) >> 2]
                                              ) {
                                                J[(d + 4) >> 2] = a + 1;
                                                a = K[a | 0];
                                                break W;
                                              }
                                              a = Ca(d);
                                            }
                                            g = K[(a + 7249) | 0];
                                            if (e >>> 0 <= g >>> 0) {
                                              break J;
                                            }
                                            Sa(x, e, 0, 0, 0, f, j, 0, 0);
                                            if (
                                              !(
                                                J[(x + 8) >> 2] |
                                                J[(x + 12) >> 2]
                                              )
                                            ) {
                                              continue;
                                            }
                                            break;
                                          }
                                        }
                                      }
                                      if (K[(a + 7249) | 0] >= e >>> 0) {
                                        break I;
                                      }
                                      while (1) {
                                        a = J[(d + 4) >> 2];
                                        X: {
                                          if ((a | 0) != J[(d + 104) >> 2]) {
                                            J[(d + 4) >> 2] = a + 1;
                                            a = K[a | 0];
                                            break X;
                                          }
                                          a = Ca(d);
                                        }
                                        if (K[(a + 7249) | 0] < e >>> 0) {
                                          continue;
                                        }
                                        break;
                                      }
                                      J[4158] = 68;
                                      i = 0;
                                      f = -1;
                                      j = -1;
                                    }
                                    a = J[(d + 116) >> 2];
                                    if ((a | 0) > 0) {
                                      a = 1;
                                    } else {
                                      a = (a | 0) >= 0;
                                    }
                                    if (a) {
                                      J[(d + 4) >> 2] = J[(d + 4) >> 2] - 1;
                                    }
                                    if (!(i | 1) & ((f & j) == -1)) {
                                      J[4158] = 68;
                                      f = -2;
                                      j = -1;
                                      break E;
                                    }
                                    a = f ^ i;
                                    f = (a - i) | 0;
                                    c = i >> 31;
                                    j =
                                      ((c ^ j) -
                                        (((a >>> 0 < i >>> 0) + c) | 0)) |
                                      0;
                                  }
                                  ka = (x + 16) | 0;
                                  a = (J[(d + 4) >> 2] - J[(d + 44) >> 2]) | 0;
                                  if (
                                    (J[(d + 120) >> 2] == ((0 - a) | 0)) &
                                    (J[(d + 124) >> 2] ==
                                      ((0 -
                                        (((a >> 31) + ((a | 0) != 0)) | 0)) |
                                        0))
                                  ) {
                                    break c;
                                  }
                                  if (!(!k | ((q | 0) != 112))) {
                                    J[k >> 2] = f;
                                    break s;
                                  }
                                  Ze(k, w, f, j);
                                  break s;
                                }
                                ((y = k),
                                  (A = _e(f, e, a, c)),
                                  (N[y >> 2] = A));
                                break s;
                              }
                              ((y = k), (B = fd(f, e, a, c)), (O[y >> 3] = B));
                              break s;
                            }
                            J[k >> 2] = f;
                            J[(k + 4) >> 2] = e;
                            J[(k + 8) >> 2] = a;
                            J[(k + 12) >> 2] = c;
                            break s;
                          }
                          g = (q | 0) != 99;
                          i = g ? 31 : (c + 1) | 0;
                          Y: {
                            if ((w | 0) == 1) {
                              c = k;
                              if (r) {
                                c = Wa(i << 2);
                                if (!c) {
                                  break e;
                                }
                              }
                              J[(h + 296) >> 2] = 0;
                              J[(h + 300) >> 2] = 0;
                              e = 0;
                              Z: {
                                _: {
                                  while (1) {
                                    a = c;
                                    while (1) {
                                      c = J[(d + 4) >> 2];
                                      $: {
                                        if ((c | 0) != J[(d + 104) >> 2]) {
                                          J[(d + 4) >> 2] = c + 1;
                                          c = K[c | 0];
                                          break $;
                                        }
                                        c = Ca(d);
                                      }
                                      if (!K[(((c + h) | 0) + 33) | 0]) {
                                        break _;
                                      }
                                      H[(h + 27) | 0] = c;
                                      c = bc(
                                        (h + 28) | 0,
                                        (h + 27) | 0,
                                        1,
                                        (h + 296) | 0,
                                      );
                                      if ((c | 0) == -2) {
                                        continue;
                                      }
                                      if ((c | 0) == -1) {
                                        n = 0;
                                        break Z;
                                      }
                                      if (a) {
                                        J[((e << 2) + a) >> 2] =
                                          J[(h + 28) >> 2];
                                        e = (e + 1) | 0;
                                      }
                                      if (!r | ((e | 0) != (i | 0))) {
                                        continue;
                                      }
                                      break;
                                    }
                                    i = (i << 1) | 1;
                                    c = Xf(a, i << 2);
                                    if (c) {
                                      continue;
                                    }
                                    break;
                                  }
                                  n = 0;
                                  o = a;
                                  r = 1;
                                  break d;
                                }
                                n = 0;
                                o = a;
                                if (!((h + 296) | 0 ? J[(h + 296) >> 2] : 0)) {
                                  break Y;
                                }
                              }
                              o = a;
                              break d;
                            }
                            if (r) {
                              e = 0;
                              c = Wa(i);
                              if (!c) {
                                break e;
                              }
                              while (1) {
                                a = c;
                                while (1) {
                                  c = J[(d + 4) >> 2];
                                  aa: {
                                    if ((c | 0) != J[(d + 104) >> 2]) {
                                      J[(d + 4) >> 2] = c + 1;
                                      c = K[c | 0];
                                      break aa;
                                    }
                                    c = Ca(d);
                                  }
                                  if (!K[(((c + h) | 0) + 33) | 0]) {
                                    n = a;
                                    o = 0;
                                    break Y;
                                  }
                                  H[(a + e) | 0] = c;
                                  e = (e + 1) | 0;
                                  if ((i | 0) != (e | 0)) {
                                    continue;
                                  }
                                  break;
                                }
                                i = (i << 1) | 1;
                                c = Xf(a, i);
                                if (c) {
                                  continue;
                                }
                                break;
                              }
                              o = 0;
                              n = a;
                              r = 1;
                              break d;
                            }
                            e = 0;
                            if (k) {
                              while (1) {
                                a = J[(d + 4) >> 2];
                                ba: {
                                  if ((a | 0) != J[(d + 104) >> 2]) {
                                    J[(d + 4) >> 2] = a + 1;
                                    a = K[a | 0];
                                    break ba;
                                  }
                                  a = Ca(d);
                                }
                                if (K[(((a + h) | 0) + 33) | 0]) {
                                  H[(e + k) | 0] = a;
                                  e = (e + 1) | 0;
                                  continue;
                                } else {
                                  a = k;
                                  n = a;
                                  o = 0;
                                  break Y;
                                }
                              }
                            }
                            while (1) {
                              a = J[(d + 4) >> 2];
                              ca: {
                                if ((a | 0) != J[(d + 104) >> 2]) {
                                  J[(d + 4) >> 2] = a + 1;
                                  a = K[a | 0];
                                  break ca;
                                }
                                a = Ca(d);
                              }
                              if (K[(((a + h) | 0) + 33) | 0]) {
                                continue;
                              }
                              break;
                            }
                            a = 0;
                            n = 0;
                            o = 0;
                          }
                          c = J[(d + 4) >> 2];
                          f = J[(d + 116) >> 2];
                          if ((f | 0) > 0) {
                            f = 1;
                          } else {
                            f = (f | 0) >= 0;
                          }
                          if (f) {
                            c = (c - 1) | 0;
                            J[(d + 4) >> 2] = c;
                          }
                          c = (c - J[(d + 44) >> 2]) | 0;
                          f = (c + J[(d + 120) >> 2]) | 0;
                          i = (J[(d + 124) >> 2] + (c >> 31)) | 0;
                          c = c >>> 0 > f >>> 0 ? (i + 1) | 0 : i;
                          if (
                            !(f | c) |
                            !(g | (((f | 0) == (j | 0)) & ((c | 0) == (m | 0))))
                          ) {
                            break c;
                          }
                          if (r) {
                            J[k >> 2] = a;
                          }
                          if ((q | 0) == 99) {
                            break s;
                          }
                          if (o) {
                            J[((e << 2) + o) >> 2] = 0;
                          }
                          if (!n) {
                            n = 0;
                            break s;
                          }
                          H[(e + n) | 0] = 0;
                        }
                        a = (J[(d + 4) >> 2] - J[(d + 44) >> 2]) | 0;
                        c = a;
                        f = a >> 31;
                        a = (s + J[(d + 124) >> 2]) | 0;
                        g = (a + 1) | 0;
                        e = a;
                        a = (l + J[(d + 120) >> 2]) | 0;
                        f = (f + (a >>> 0 < l >>> 0 ? g : e)) | 0;
                        l = (a + c) | 0;
                        s = l >>> 0 < a >>> 0 ? (f + 1) | 0 : f;
                        t = (((k | 0) != 0) + t) | 0;
                      }
                      e = (b + 1) | 0;
                      b = K[(b + 1) | 0];
                      if (b) {
                        continue;
                      }
                      break a;
                    }
                    break;
                  }
                  r = 1;
                  n = 0;
                  o = 0;
                }
                t = t ? t : -1;
              }
              if (!r) {
                break a;
              }
              Aa(n);
              Aa(o);
              break a;
            }
            t = -1;
          }
          ka = (h + 304) | 0;
          ka = (d + 144) | 0;
          wb((u + 8) | 0);
          ka = (u + 16) | 0;
          return t;
        }
        function cf(a, b, c, d, e, f, g, h, i) {
          var j = 0,
            k = 0,
            l = 0,
            m = 0,
            n = 0,
            o = 0,
            p = 0,
            q = 0,
            r = 0,
            s = 0,
            t = 0,
            u = 0,
            v = 0,
            w = 0,
            x = 0,
            y = 0,
            z = 0,
            A = 0,
            B = 0,
            C = 0,
            D = 0,
            E = 0,
            F = 0,
            G = 0,
            H = 0,
            I = 0,
            K = 0,
            L = 0,
            N = 0,
            O = 0,
            P = 0,
            Q = 0;
          k = (ka - 336) | 0;
          ka = k;
          j = h;
          n = i & 65535;
          p = e & 65535;
          o = d;
          t = (e ^ i) & -2147483648;
          q = (i >>> 16) & 32767;
          r = (e >>> 16) & 32767;
          a: {
            b: {
              if (
                ((q - 32767) >>> 0 > 4294934529) &
                ((r - 32767) >>> 0 >= 4294934530)
              ) {
                break b;
              }
              l = e & 2147483647;
              if (
                !(!d & ((l | 0) == 2147418112)
                  ? !(b | c)
                  : l >>> 0 < 2147418112)
              ) {
                v = d;
                t = e | 32768;
                break a;
              }
              e = i & 2147483647;
              if (
                !(!h & ((e | 0) == 2147418112)
                  ? !(f | g)
                  : e >>> 0 < 2147418112)
              ) {
                v = h;
                t = i | 32768;
                b = f;
                c = g;
                break a;
              }
              if (!(b | d | ((l ^ 2147418112) | c))) {
                if (!(f | h | ((e ^ 2147418112) | g))) {
                  b = 0;
                  c = 0;
                  t = 2147450880;
                  break a;
                }
                t = t | 2147418112;
                b = 0;
                c = 0;
                break a;
              }
              if (!(f | h | ((e ^ 2147418112) | g))) {
                b = 0;
                c = 0;
                break a;
              }
              if (!(b | d | (c | l))) {
                b = !(f | h | (e | g));
                v = b ? 0 : v;
                t = b ? 2147450880 : t;
                b = 0;
                c = 0;
                break a;
              }
              if (!(f | h | (e | g))) {
                t = t | 2147418112;
                b = 0;
                c = 0;
                break a;
              }
              if (((l | 0) == 65535) | (l >>> 0 < 65535)) {
                d = !(o | p);
                i = S(d ? c : p);
                d =
                  (((i | 0) == 32 ? (S(d ? b : o) + 32) | 0 : i) +
                    (d ? 64 : 0)) |
                  0;
                Ta((k + 320) | 0, b, c, o, p, (d - 15) | 0);
                w = (16 - d) | 0;
                o = J[(k + 328) >> 2];
                p = J[(k + 332) >> 2];
                c = J[(k + 324) >> 2];
                b = J[(k + 320) >> 2];
              }
              if (e >>> 0 > 65535) {
                break b;
              }
              d = !(j | n);
              h = S(d ? g : n);
              d =
                (((h | 0) == 32 ? (S(d ? f : j) + 32) | 0 : h) + (d ? 64 : 0)) |
                0;
              Ta((k + 304) | 0, f, g, j, n, (d - 15) | 0);
              w = (((d + w) | 0) - 16) | 0;
              j = J[(k + 312) >> 2];
              n = J[(k + 316) >> 2];
              f = J[(k + 304) >> 2];
              g = J[(k + 308) >> 2];
            }
            d = n | 65536;
            B = d;
            C = j;
            e = j;
            d = (d << 15) | (e >>> 17);
            h = (e << 15) | (g >>> 17);
            j = (0 - h) | 0;
            i = d;
            e = d;
            d = (1963258675 - ((d + ((h | 0) != 0)) | 0)) | 0;
            Sa((k + 288) | 0, h, e, 0, 0, j, d, 0, 0);
            e = J[(k + 296) >> 2];
            Sa(
              (k + 272) | 0,
              (0 - e) | 0,
              (0 - ((J[(k + 300) >> 2] + ((e | 0) != 0)) | 0)) | 0,
              0,
              0,
              j,
              d,
              0,
              0,
            );
            e = J[(k + 280) >> 2];
            j = (e << 1) | (J[(k + 276) >> 2] >>> 31);
            d = (J[(k + 284) >> 2] << 1) | (e >>> 31);
            Sa((k + 256) | 0, j, d, 0, 0, h, i, 0, 0);
            e = J[(k + 264) >> 2];
            Sa(
              (k + 240) | 0,
              j,
              d,
              0,
              0,
              (0 - e) | 0,
              (0 - ((J[(k + 268) >> 2] + ((e | 0) != 0)) | 0)) | 0,
              0,
              0,
            );
            d = J[(k + 248) >> 2];
            j = (d << 1) | (J[(k + 244) >> 2] >>> 31);
            d = (J[(k + 252) >> 2] << 1) | (d >>> 31);
            Sa((k + 224) | 0, j, d, 0, 0, h, i, 0, 0);
            e = J[(k + 232) >> 2];
            Sa(
              (k + 208) | 0,
              j,
              d,
              0,
              0,
              (0 - e) | 0,
              (0 - ((J[(k + 236) >> 2] + ((e | 0) != 0)) | 0)) | 0,
              0,
              0,
            );
            e = J[(k + 216) >> 2];
            j = (e << 1) | (J[(k + 212) >> 2] >>> 31);
            d = (J[(k + 220) >> 2] << 1) | (e >>> 31);
            Sa((k + 192) | 0, j, d, 0, 0, h, i, 0, 0);
            e = J[(k + 200) >> 2];
            Sa(
              (k + 176) | 0,
              j,
              d,
              0,
              0,
              (0 - e) | 0,
              (0 - ((J[(k + 204) >> 2] + ((e | 0) != 0)) | 0)) | 0,
              0,
              0,
            );
            d = J[(k + 184) >> 2];
            e = h;
            j = i;
            l = (d << 1) | (J[(k + 180) >> 2] >>> 31);
            h = (l - 1) | 0;
            i = (((J[(k + 188) >> 2] << 1) | (d >>> 31)) - !l) | 0;
            Sa((k + 160) | 0, e, j, 0, 0, h, i, 0, 0);
            Sa(
              (k + 144) | 0,
              f << 15,
              (g << 15) | (f >>> 17),
              0,
              0,
              h,
              i,
              0,
              0,
            );
            u = (k + 112) | 0;
            D = J[(k + 168) >> 2];
            e = J[(k + 172) >> 2];
            l = J[(k + 160) >> 2];
            j = J[(k + 152) >> 2];
            n = (l + j) | 0;
            m = J[(k + 164) >> 2];
            d = (m + J[(k + 156) >> 2]) | 0;
            d = j >>> 0 > n >>> 0 ? (d + 1) | 0 : d;
            j = d;
            d =
              (((m | 0) == (d | 0)) & (l >>> 0 > n >>> 0)) |
              (d >>> 0 < m >>> 0);
            m = (d + D) | 0;
            d = d >>> 0 > m >>> 0 ? (e + 1) | 0 : e;
            l = (!j & (n >>> 0 > 1)) | ((j | 0) != 0);
            e = (l + m) | 0;
            d = l >>> 0 > e >>> 0 ? (d + 1) | 0 : d;
            Sa(
              u,
              h,
              i,
              0,
              0,
              (0 - e) | 0,
              (0 - ((((e | 0) != 0) + d) | 0)) | 0,
              0,
              0,
            );
            Sa(
              (k + 128) | 0,
              (1 - n) | 0,
              (0 - (((n >>> 0 > 1) + j) | 0)) | 0,
              0,
              0,
              h,
              i,
              0,
              0,
            );
            K = (((r - q) | 0) + w) | 0;
            w = (K + 16383) | 0;
            h = J[(k + 116) >> 2];
            z = h;
            e = J[(k + 112) >> 2];
            d = (h << 1) | (e >>> 31);
            l = e << 1;
            s = d;
            e = d;
            i = J[(k + 140) >> 2];
            u = i;
            h = J[(k + 136) >> 2];
            d = (i << 1) | (h >>> 31);
            i = (h << 1) | (J[(k + 132) >> 2] >>> 31);
            j = (i + l) | 0;
            e = (d + e) | 0;
            e = i >>> 0 > j >>> 0 ? (e + 1) | 0 : e;
            h = e;
            d = (e - (j >>> 0 < 13927)) | 0;
            r = d;
            i = 0;
            d = p | 65536;
            L = d;
            N = o;
            e = o;
            d = (d << 1) | (e >>> 31);
            P = e << 1;
            Q = d;
            E = d;
            d = dk(r, i, d, 0);
            e = na;
            x = d;
            y = e;
            H = b << 1;
            e = (c << 1) | (b >>> 31);
            q = e;
            d = 0;
            D = d;
            m = d;
            n = (j - 13927) | 0;
            A =
              (((h | 0) == (r | 0)) & (n >>> 0 < j >>> 0)) |
              (h >>> 0 > r >>> 0);
            j =
              (((h | 0) == (s | 0)) & (j >>> 0 < l >>> 0)) |
              (h >>> 0 < s >>> 0);
            d = J[(k + 120) >> 2];
            e = (J[(k + 124) >> 2] << 1) | (d >>> 31);
            l = (u >>> 31) | 0;
            h = (l + ((d << 1) | (z >>> 31))) | 0;
            d = e;
            d = h >>> 0 < l >>> 0 ? (d + 1) | 0 : d;
            e = (h + j) | 0;
            d = e >>> 0 < h >>> 0 ? (d + 1) | 0 : d;
            h = e;
            e = (e + A) | 0;
            i = h >>> 0 > e >>> 0 ? (d + 1) | 0 : d;
            h = (e - 1) | 0;
            A = (i - !e) | 0;
            s = 0;
            i = dk(q, m, A, s);
            d = (i + x) | 0;
            e = (na + y) | 0;
            e = d >>> 0 < i >>> 0 ? (e + 1) | 0 : e;
            u =
              (((y | 0) == (e | 0)) & (d >>> 0 < x >>> 0)) |
              (e >>> 0 < y >>> 0);
            l = d;
            j = d;
            i = e;
            d = 0;
            z = h;
            O = (c >>> 31) | 0;
            x = O | (o << 1);
            y = 0;
            h = dk(h, d, x, y);
            e = (h + j) | 0;
            d = (na + i) | 0;
            p = e;
            d = e >>> 0 < h >>> 0 ? (d + 1) | 0 : d;
            j = d;
            d =
              (((d | 0) == (i | 0)) & (e >>> 0 < l >>> 0)) |
              (d >>> 0 < i >>> 0);
            i = 0;
            e = d;
            d = (d + u) | 0;
            i = e >>> 0 > d >>> 0 ? 1 : i;
            h = dk(E, m, A, s);
            e = (h + d) | 0;
            d = (na + i) | 0;
            u = e;
            o = e >>> 0 < h >>> 0 ? (d + 1) | 0 : d;
            d = dk(E, m, z, y);
            l = na;
            e = d;
            h = dk(x, y, A, s);
            i = (d + h) | 0;
            d = (na + l) | 0;
            d = h >>> 0 > i >>> 0 ? (d + 1) | 0 : d;
            h = d;
            d =
              (((l | 0) == (d | 0)) & (e >>> 0 > i >>> 0)) |
              (d >>> 0 < l >>> 0);
            l = (u + h) | 0;
            e = (d + o) | 0;
            o = l >>> 0 < h >>> 0 ? (e + 1) | 0 : e;
            e = i;
            h = 0;
            i = (h + p) | 0;
            d = (e + j) | 0;
            e = i;
            d = e >>> 0 < h >>> 0 ? (d + 1) | 0 : d;
            h = d;
            i =
              (((j | 0) == (d | 0)) & (e >>> 0 < p >>> 0)) |
              (d >>> 0 < j >>> 0);
            d = o;
            j = i;
            i = (i + l) | 0;
            d = j >>> 0 > i >>> 0 ? (d + 1) | 0 : d;
            l = i;
            i = d;
            p = e;
            u = n;
            d = dk(n, 0, x, y);
            o = na;
            j = d;
            n = dk(r, m, q, m);
            e = (d + n) | 0;
            d = (na + o) | 0;
            d = e >>> 0 < n >>> 0 ? (d + 1) | 0 : d;
            F =
              (((o | 0) == (d | 0)) & (e >>> 0 < j >>> 0)) |
              (d >>> 0 < o >>> 0);
            j = d;
            G = H & -2;
            o = dk(z, y, G, 0);
            n = (o + e) | 0;
            d = (na + d) | 0;
            d = n >>> 0 < o >>> 0 ? (d + 1) | 0 : d;
            o = d;
            d =
              (((d | 0) == (j | 0)) & (e >>> 0 > n >>> 0)) |
              (d >>> 0 < j >>> 0);
            e = 0;
            j = d;
            d = (d + F) | 0;
            e = ((j >>> 0 > d >>> 0 ? 1 : e) + h) | 0;
            j = d;
            d = (d + p) | 0;
            e = j >>> 0 > d >>> 0 ? (e + 1) | 0 : e;
            j = e;
            I = p;
            p = d;
            e =
              (((e | 0) == (h | 0)) & (I >>> 0 > d >>> 0)) |
              (e >>> 0 < h >>> 0);
            d = i;
            h = e;
            e = (e + l) | 0;
            d = h >>> 0 > e >>> 0 ? (d + 1) | 0 : d;
            I = e;
            l = d;
            d = dk(E, m, u, v);
            F = na;
            E = d;
            h = dk(G, v, A, s);
            e = (d + h) | 0;
            d = (na + F) | 0;
            d = e >>> 0 < h >>> 0 ? (d + 1) | 0 : d;
            s = e;
            i = dk(r, m, x, y);
            h = (e + i) | 0;
            m = d;
            e = (d + na) | 0;
            e = h >>> 0 < i >>> 0 ? (e + 1) | 0 : e;
            x = h;
            d = dk(q, D, z, y);
            h = (h + d) | 0;
            i = (na + e) | 0;
            i = d >>> 0 > h >>> 0 ? (i + 1) | 0 : i;
            A = i;
            z = 0;
            i =
              (((e | 0) == (i | 0)) & (h >>> 0 < x >>> 0)) |
              (e >>> 0 > i >>> 0);
            d =
              (((e | 0) == (m | 0)) & (s >>> 0 > x >>> 0)) |
              (e >>> 0 < m >>> 0);
            m =
              (d +
                ((((m | 0) == (F | 0)) & (s >>> 0 < E >>> 0)) |
                  (m >>> 0 < F >>> 0))) |
              0;
            e = (i + m) | 0;
            d = ((e | z) + j) | 0;
            m = A;
            s = (m + p) | 0;
            e = s;
            d = m >>> 0 > e >>> 0 ? (d + 1) | 0 : d;
            m = d;
            j =
              (((j | 0) == (d | 0)) & (p >>> 0 > e >>> 0)) |
              (d >>> 0 < j >>> 0);
            d = l;
            i = j;
            j = (j + I) | 0;
            d = i >>> 0 > j >>> 0 ? (d + 1) | 0 : d;
            x = j;
            l = d;
            z = e;
            s = m;
            d = dk(r, D, G, v);
            r = na;
            m = d;
            e = dk(q, D, u, v);
            j = (d + e) | 0;
            d = (na + r) | 0;
            d = e >>> 0 > j >>> 0 ? (d + 1) | 0 : d;
            p = d;
            d = 0;
            e =
              (((p | 0) == (r | 0)) & (j >>> 0 < m >>> 0)) |
              (p >>> 0 < r >>> 0);
            m = (p + n) | 0;
            d = ((d | e) + o) | 0;
            d = m >>> 0 < p >>> 0 ? (d + 1) | 0 : d;
            n =
              (((o | 0) == (d | 0)) & (n >>> 0 > m >>> 0)) |
              (d >>> 0 < o >>> 0);
            e = d;
            d = h;
            o = 0;
            h = (o + m) | 0;
            i = (d + e) | 0;
            d = 0;
            i = h >>> 0 < o >>> 0 ? (i + 1) | 0 : i;
            o = i;
            e =
              (((i | 0) == (e | 0)) & (h >>> 0 < m >>> 0)) |
              (e >>> 0 > i >>> 0);
            i = e;
            e = (e + n) | 0;
            d = ((i >>> 0 > e >>> 0 ? 1 : d) + s) | 0;
            i = l;
            m = e;
            e = (e + z) | 0;
            d = m >>> 0 > e >>> 0 ? (d + 1) | 0 : d;
            n =
              (((d | 0) == (s | 0)) & (e >>> 0 < z >>> 0)) |
              (d >>> 0 < s >>> 0);
            m = n;
            n = (n + x) | 0;
            i = m >>> 0 > n >>> 0 ? (i + 1) | 0 : i;
            r = n;
            m = e;
            n = e;
            l = d;
            e = j;
            p = 0;
            u = dk(G, v, u, v);
            j = (p + u) | 0;
            d = e;
            e = (d + na) | 0;
            e = j >>> 0 < u >>> 0 ? (e + 1) | 0 : e;
            d =
              ((((d | 0) == (e | 0)) & (j >>> 0 < p >>> 0)) |
                (d >>> 0 > e >>> 0)) ^
              -1;
            e =
              ((o | 0) == -1) &
              (d >>> 0 < h >>> 0) &
              (((d | 0) != (h | 0)) | ((o | 0) != -1));
            d = l;
            n = (e + n) | 0;
            d = n >>> 0 < e >>> 0 ? (d + 1) | 0 : d;
            h = d;
            e =
              (((l | 0) == (d | 0)) & (n >>> 0 < m >>> 0)) |
              (d >>> 0 < l >>> 0);
            d = i;
            j = (e + r) | 0;
            d = j >>> 0 < e >>> 0 ? (d + 1) | 0 : d;
            e = d;
            c: {
              if (((d | 0) == 131071) | (d >>> 0 < 131071)) {
                N = P | O;
                L = y | Q;
                r = (k + 80) | 0;
                o = n;
                l = d >>> 0 < 65536;
                i = l;
                if ((i & 63) >>> 0 >= 32) {
                  d = n << i;
                  o = 0;
                } else {
                  d = (((1 << i) - 1) & (o >>> (32 - i))) | (h << i);
                  o = o << i;
                }
                p = d;
                m = j;
                i = l & 31;
                p = d;
                if ((l & 63) >>> 0 >= 32) {
                  e = j << i;
                  c = 0;
                } else {
                  e = (((1 << i) - 1) & (m >>> (32 - i))) | (e << i);
                  c = m << i;
                }
                i = (h >>> 1) | 0;
                n = ((h & 1) << 31) | (n >>> 1);
                j = l ^ 63;
                h = j & 31;
                if ((j & 63) >>> 0 >= 32) {
                  d = 0;
                  h = (i >>> h) | 0;
                } else {
                  d = (i >>> h) | 0;
                  h = ((((1 << h) - 1) & i) << (32 - h)) | (n >>> h);
                }
                h = c | h;
                i = d | e;
                Sa(r, o, p, h, i, f, g, C, B);
                w = ((l ? (K + 16382) | 0 : w) - 1) | 0;
                e = J[(k + 84) >> 2];
                m = e;
                d = b << 17;
                n = 0;
                l = J[(k + 88) >> 2];
                b = (n - l) | 0;
                c = J[(k + 80) >> 2];
                e = (e | c) != 0;
                j = (b - e) | 0;
                n =
                  (((d - ((J[(k + 92) >> 2] + (l >>> 0 > n >>> 0)) | 0)) | 0) -
                    (b >>> 0 < e >>> 0)) |
                  0;
                l = (0 - ((((c | 0) != 0) + m) | 0)) | 0;
                m = (0 - c) | 0;
                break c;
              }
              o = ((h & 1) << 31) | (n >>> 1);
              d = (j << 31) | (h >>> 1);
              p = d;
              h = ((e & 1) << 31) | (j >>> 1);
              i = (e >>> 1) | 0;
              Sa((k + 96) | 0, o, d, h, i, f, g, C, B);
              j = J[(k + 100) >> 2];
              r = j;
              q = 0;
              m = J[(k + 104) >> 2];
              n = (q - m) | 0;
              e = J[(k + 96) >> 2];
              l = (j | e) != 0;
              j = (n - l) | 0;
              n =
                ((((b << 16) -
                  ((J[(k + 108) >> 2] + (m >>> 0 > q >>> 0)) | 0)) |
                  0) -
                  (l >>> 0 > n >>> 0)) |
                0;
              H = b;
              q = c;
              l = (0 - ((((e | 0) != 0) + r) | 0)) | 0;
              m = (0 - e) | 0;
            }
            if ((w | 0) >= 32767) {
              t = t | 2147418112;
              b = 0;
              c = 0;
              break a;
            }
            d: {
              if ((w | 0) > 0) {
                b = (j << 1) | (l >>> 31);
                c = (n << 1) | (j >>> 31);
                j = h;
                n = (i & 65535) | (w << 16);
                h = m << 1;
                e = (l << 1) | (m >>> 31);
                break d;
              }
              if ((w | 0) <= -113) {
                b = 0;
                c = 0;
                break a;
              }
              Gb((k - -64) | 0, o, p, h, i, (1 - w) | 0);
              Ta((k + 48) | 0, H, q, N, L, (w + 112) | 0);
              o = J[(k + 64) >> 2];
              p = J[(k + 68) >> 2];
              j = J[(k + 72) >> 2];
              n = J[(k + 76) >> 2];
              Sa((k + 32) | 0, f, g, C, B, o, p, j, n);
              b = J[(k + 40) >> 2];
              c = J[(k + 56) >> 2];
              h = J[(k + 36) >> 2];
              q = (b << 1) | (h >>> 31);
              i = (c - q) | 0;
              q =
                (J[(k + 60) >> 2] -
                  ((((J[(k + 44) >> 2] << 1) | (b >>> 31)) +
                    (c >>> 0 < q >>> 0)) |
                    0)) |
                0;
              c = J[(k + 52) >> 2];
              m = c;
              b = J[(k + 32) >> 2];
              e = (h << 1) | (b >>> 31);
              l = b << 1;
              d = J[(k + 48) >> 2];
              c =
                (((m | 0) == (e | 0)) & (l >>> 0 > d >>> 0)) |
                (m >>> 0 < e >>> 0);
              b = (i - c) | 0;
              c = (q - (c >>> 0 > i >>> 0)) | 0;
              h = (d - l) | 0;
              e = (m - (((d >>> 0 < l >>> 0) + e) | 0)) | 0;
            }
            Sa((k + 16) | 0, f, g, C, B, 3, 0, 0, 0);
            Sa(k, f, g, C, B, 5, 0, 0, 0);
            d = n;
            i = p;
            n = f;
            l = 0;
            e = (e + l) | 0;
            f = g;
            g = h;
            q = o & 1;
            h = (h + q) | 0;
            e = g >>> 0 > h >>> 0 ? (e + 1) | 0 : e;
            g = e;
            n =
              (((f | 0) == (e | 0)) & (h >>> 0 > n >>> 0)) |
              (e >>> 0 > f >>> 0);
            f =
              (((e | 0) == (l | 0)) & (h >>> 0 < q >>> 0)) |
              (e >>> 0 < l >>> 0);
            e = c;
            c = f;
            f = (b + f) | 0;
            e = c >>> 0 > f >>> 0 ? (e + 1) | 0 : e;
            b = (B | 0) == (e | 0);
            b =
              b & ((f | 0) == (C | 0))
                ? n
                : (b & (f >>> 0 > C >>> 0)) | (e >>> 0 > B >>> 0);
            c = b;
            b = (b + o) | 0;
            i = c >>> 0 > b >>> 0 ? (i + 1) | 0 : i;
            c =
              (((p | 0) == (i | 0)) & (b >>> 0 < o >>> 0)) |
              (i >>> 0 < p >>> 0);
            m = c;
            c = (c + j) | 0;
            d = m >>> 0 > c >>> 0 ? (d + 1) | 0 : d;
            o = c;
            c = d;
            m = d >>> 0 < 2147418112;
            d = J[(k + 20) >> 2];
            l =
              (((d | 0) == (g | 0)) & (M[(k + 16) >> 2] < h >>> 0)) |
              (d >>> 0 < g >>> 0);
            d = J[(k + 28) >> 2];
            j = J[(k + 24) >> 2];
            j =
              m &
              (((f | 0) == (j | 0)) & ((d | 0) == (e | 0))
                ? l
                : (((d | 0) == (e | 0)) & (j >>> 0 < f >>> 0)) |
                  (d >>> 0 < e >>> 0));
            d = i;
            m = j;
            j = (b + j) | 0;
            d = m >>> 0 > j >>> 0 ? (d + 1) | 0 : d;
            b =
              (((i | 0) == (d | 0)) & (b >>> 0 > j >>> 0)) |
              (d >>> 0 < i >>> 0);
            i = c;
            c = b;
            b = (b + o) | 0;
            i = c >>> 0 > b >>> 0 ? (i + 1) | 0 : i;
            o = b;
            c = J[(k + 4) >> 2];
            g =
              (((c | 0) == (g | 0)) & (M[k >> 2] < h >>> 0)) |
              (c >>> 0 < g >>> 0);
            c = J[(k + 12) >> 2];
            b = J[(k + 8) >> 2];
            b =
              (i >>> 0 < 2147418112) &
              (((b | 0) == (f | 0)) & ((c | 0) == (e | 0))
                ? g
                : (((c | 0) == (e | 0)) & (b >>> 0 < f >>> 0)) |
                  (c >>> 0 < e >>> 0));
            c = b;
            b = (b + j) | 0;
            e = c >>> 0 > b >>> 0 ? (d + 1) | 0 : d;
            c = e;
            e =
              (((d | 0) == (e | 0)) & (b >>> 0 < j >>> 0)) |
              (d >>> 0 > e >>> 0);
            d = i;
            f = e;
            e = (e + o) | 0;
            d = f >>> 0 > e >>> 0 ? (d + 1) | 0 : d;
            v = e | v;
            t = d | t;
          }
          J[a >> 2] = b;
          J[(a + 4) >> 2] = c;
          J[(a + 8) >> 2] = v;
          J[(a + 12) >> 2] = t;
          ka = (k + 336) | 0;
        }
        function $i(a) {
          a = a | 0;
          var b = 0,
            c = 0,
            d = 0,
            e = 0,
            f = 0,
            g = 0,
            h = 0,
            i = 0,
            j = 0,
            k = 0,
            l = 0,
            m = 0,
            n = 0,
            o = 0,
            p = 0;
          i = (ka - 32) | 0;
          ka = i;
          l = Eb((i + 20) | 0, a);
          m = Tb((i + 8) | 0, l);
          k = (ka - 16) | 0;
          ka = k;
          j = Tb((k + 4) | 0, m);
          f = (ka - 208) | 0;
          ka = f;
          J[4146] = -1;
          a = J[4143];
          if (a) {
            oa[J[(J[a >> 2] + 28) >> 2]](a);
          }
          d = (f + 16) | 0;
          J[(d + 136) >> 2] = 0;
          J[(d + 108) >> 2] = 5208;
          J[d >> 2] = 5188;
          a = J[1305];
          J[d >> 2] = a;
          J[(J[(a - 12) >> 2] + d) >> 2] = J[1306];
          J[(d + 4) >> 2] = 0;
          c = (d + 8) | 0;
          ac((J[(J[d >> 2] - 12) >> 2] + d) | 0, c);
          J[d >> 2] = 5188;
          J[(d + 108) >> 2] = 5208;
          a = (ka - 16) | 0;
          ka = a;
          c = rd(c);
          J[(c + 40) >> 2] = 0;
          J[(c + 32) >> 2] = 0;
          J[(c + 36) >> 2] = 0;
          J[c >> 2] = 4600;
          D((c + 52) | 0, 0, 40);
          H[(c + 98) | 0] = 0;
          I[(c + 96) >> 1] = 0;
          J[(c + 92) >> 2] = 32;
          b = (c + 4) | 0;
          e = Db((a + 12) | 0, b);
          h = ne(J[e >> 2], Ga(21176));
          fb(e);
          if (h) {
            b = Db((a + 8) | 0, b);
            ((o = c), (p = ec(b)), (J[(o + 68) >> 2] = p));
            fb(b);
            b = J[(c + 68) >> 2];
            ((o = c),
              (p = oa[J[(J[b >> 2] + 28) >> 2]](b) | 0),
              (H[(o + 98) | 0] = p));
          }
          oa[J[(J[c >> 2] + 12) >> 2]](c, 0, 4096) | 0;
          ka = (a + 16) | 0;
          g = H[(j + 11) | 0] < 0 ? J[j >> 2] : j;
          b = 0;
          if (J[(c + 64) >> 2]) {
            a = 0;
          } else {
            h = (ka - 16) | 0;
            ka = h;
            a: {
              b: {
                if (!Qb(1865, H[1843])) {
                  J[4158] = 28;
                  break b;
                }
                a = 2;
                if (!Qb(1843, 43)) {
                  a = K[1843] != 114;
                }
                a = Qb(1843, 120) ? a | 128 : a;
                a = Qb(1843, 101) ? a | 524288 : a;
                e = a;
                n = a | 64;
                a = K[1843];
                e = (a | 0) == 114 ? e : n;
                e = (a | 0) == 119 ? e | 512 : e;
                J[h >> 2] = 438;
                J[(h + 4) >> 2] = 0;
                a =
                  ga(
                    -100,
                    g | 0,
                    ((a | 0) == 97 ? e | 1024 : e) | 32768,
                    h | 0,
                  ) | 0;
                if (a >>> 0 >= 4294963201) {
                  J[4158] = 0 - a;
                  a = -1;
                }
                if ((a | 0) < 0) {
                  break a;
                }
                e = (ka - 32) | 0;
                ka = e;
                c: {
                  d: {
                    e: {
                      if (!Qb(1865, H[1843])) {
                        J[4158] = 28;
                        break e;
                      }
                      b = Wa(1176);
                      if (b) {
                        break d;
                      }
                    }
                    b = 0;
                    break c;
                  }
                  wd(b, 0, 144);
                  if (!Qb(1843, 43)) {
                    J[b >> 2] = K[1843] == 114 ? 8 : 4;
                  }
                  f: {
                    if (K[1843] != 97) {
                      g = J[b >> 2];
                      break f;
                    }
                    g = ba(a | 0, 3, 0) | 0;
                    if (!(g & 1024)) {
                      g = g | 1024;
                      J[(e + 16) >> 2] = g;
                      J[(e + 20) >> 2] = g >> 31;
                      ba(a | 0, 4, (e + 16) | 0) | 0;
                    }
                    g = J[b >> 2] | 128;
                    J[b >> 2] = g;
                  }
                  J[(b + 80) >> 2] = -1;
                  J[(b + 48) >> 2] = 1024;
                  J[(b + 60) >> 2] = a;
                  J[(b + 44) >> 2] = b + 152;
                  g: {
                    if (g & 8) {
                      break g;
                    }
                    J[e >> 2] = e + 24;
                    J[(e + 4) >> 2] = 0;
                    if (fa(a | 0, 21523, e | 0) | 0) {
                      break g;
                    }
                    J[(b + 80) >> 2] = 10;
                  }
                  J[(b + 40) >> 2] = 172;
                  J[(b + 36) >> 2] = 173;
                  J[(b + 32) >> 2] = 174;
                  J[(b + 12) >> 2] = 175;
                  if (!K[17133]) {
                    J[(b + 76) >> 2] = -1;
                  }
                  g = J[4298];
                  J[(b + 56) >> 2] = g;
                  if (g) {
                    J[(g + 52) >> 2] = b;
                  }
                  J[4298] = b;
                }
                ka = (e + 32) | 0;
                if (b) {
                  break a;
                }
                $(a | 0) | 0;
              }
              b = 0;
            }
            ka = (h + 16) | 0;
            J[(c + 64) >> 2] = b;
            a = 0;
            h: {
              if (!b) {
                break h;
              }
              J[(c + 88) >> 2] = 12;
              if (J[(c + 92) >> 2] == 34) {
                Uf(b);
                J[(c + 92) >> 2] = 0;
              }
              a = c;
            }
          }
          if (!a) {
            ob((J[(J[d >> 2] - 12) >> 2] + d) | 0, 4);
          }
          i: {
            if (K[(((J[(J[d >> 2] - 12) >> 2] + d) | 0) + 16) | 0] & 5) {
              break i;
            }
            zb(d, (f + 15) | 0, 1);
            if (
              (K[(((J[(J[d >> 2] - 12) >> 2] + d) | 0) + 16) | 0] & 5) |
              (J[4144] != H[(f + 15) | 0])
            ) {
              break i;
            }
            zb(d, (f + 14) | 0, 1);
            if (
              (K[(((J[(J[d >> 2] - 12) >> 2] + d) | 0) + 16) | 0] & 5) |
              (J[4145] != H[(f + 14) | 0])
            ) {
              break i;
            }
            zb(d, (f + 13) | 0, 1);
            if (
              (K[(((J[(J[d >> 2] - 12) >> 2] + d) | 0) + 16) | 0] & 5) |
              (H[(f + 13) | 0] > (P(J[4145], J[4144]) | 0))
            ) {
              break i;
            }
            zb(d, (f + 11) | 0, 1);
            if (
              (K[(((J[(J[d >> 2] - 12) >> 2] + d) | 0) + 16) | 0] & 5) |
              (H[(f + 11) | 0] > 8)
            ) {
              break i;
            }
            zb(d, (f + 12) | 0, 1);
            if (
              (K[(((J[(J[d >> 2] - 12) >> 2] + d) | 0) + 16) | 0] & 5) |
              (K[(f + 12) | 0] != 1)
            ) {
              break i;
            }
            zb(d, (f + 10) | 0, 1);
            if (K[(((J[(J[d >> 2] - 12) >> 2] + d) | 0) + 16) | 0] & 5) {
              break i;
            }
            a = H[(f + 10) | 0];
            if ((a | 0) > 40) {
              break i;
            }
            j: {
              k: {
                l: {
                  m: {
                    n: {
                      c = H[(f + 11) | 0];
                      switch ((c - 1) | 0) {
                        case 1:
                          break m;
                        case 3:
                          break l;
                        case 0:
                          break n;
                        default:
                          break k;
                      }
                    }
                    o: {
                      p: {
                        switch ((a - 21) | 0) {
                          case 0:
                            a = za(12);
                            J[a >> 2] = 2152;
                            c = za(2097169);
                            J[(a + 4) >> 2] = c;
                            b = za(2097169);
                            J[(a + 8) >> 2] = b;
                            D(c, 0, 2097169);
                            D(b, 0, 2097169);
                            break o;
                          case 1:
                            a = za(12);
                            J[a >> 2] = 2260;
                            c = za(4194319);
                            J[(a + 4) >> 2] = c;
                            b = za(4194319);
                            J[(a + 8) >> 2] = b;
                            D(c, 0, 4194319);
                            D(b, 0, 4194319);
                            break o;
                          case 2:
                            a = za(12);
                            J[a >> 2] = 2368;
                            c = za(8388617);
                            J[(a + 4) >> 2] = c;
                            b = za(8388617);
                            J[(a + 8) >> 2] = b;
                            D(c, 0, 8388617);
                            D(b, 0, 8388617);
                            break o;
                          case 3:
                            a = za(12);
                            J[a >> 2] = 2476;
                            c = za(16777259);
                            J[(a + 4) >> 2] = c;
                            b = za(16777259);
                            J[(a + 8) >> 2] = b;
                            D(c, 0, 16777259);
                            D(b, 0, 16777259);
                            break o;
                          case 4:
                            a = za(12);
                            J[a >> 2] = 2584;
                            c = za(33554467);
                            J[(a + 4) >> 2] = c;
                            b = za(33554467);
                            J[(a + 8) >> 2] = b;
                            D(c, 0, 33554467);
                            D(b, 0, 33554467);
                            break o;
                          case 5:
                            a = za(12);
                            J[a >> 2] = 2692;
                            c = za(67108879);
                            J[(a + 4) >> 2] = c;
                            b = za(67108879);
                            J[(a + 8) >> 2] = b;
                            D(c, 0, 67108879);
                            D(b, 0, 67108879);
                            break o;
                          case 6:
                            a = za(12);
                            J[a >> 2] = 2800;
                            c = za(134217757);
                            J[(a + 4) >> 2] = c;
                            b = za(134217757);
                            J[(a + 8) >> 2] = b;
                            D(c, 0, 134217757);
                            D(b, 0, 134217757);
                            break o;
                          default:
                            break p;
                        }
                      }
                      wc(Bc(cc(19716, 2105), a));
                      a = 0;
                    }
                    break j;
                  }
                  q: {
                    r: {
                      switch ((a - 21) | 0) {
                        case 0:
                          a = za(12);
                          J[a >> 2] = 2908;
                          c = za(4194338);
                          J[(a + 4) >> 2] = c;
                          b = za(2097169);
                          J[(a + 8) >> 2] = b;
                          D(c, 0, 4194338);
                          D(b, 0, 2097169);
                          break q;
                        case 1:
                          a = za(12);
                          J[a >> 2] = 3016;
                          c = za(8388638);
                          J[(a + 4) >> 2] = c;
                          b = za(4194319);
                          J[(a + 8) >> 2] = b;
                          D(c, 0, 8388638);
                          D(b, 0, 4194319);
                          break q;
                        case 2:
                          a = za(12);
                          J[a >> 2] = 3124;
                          c = za(16777234);
                          J[(a + 4) >> 2] = c;
                          b = za(8388617);
                          J[(a + 8) >> 2] = b;
                          D(c, 0, 16777234);
                          D(b, 0, 8388617);
                          break q;
                        case 3:
                          a = za(12);
                          J[a >> 2] = 3232;
                          c = za(33554518);
                          J[(a + 4) >> 2] = c;
                          b = za(16777259);
                          J[(a + 8) >> 2] = b;
                          D(c, 0, 33554518);
                          D(b, 0, 16777259);
                          break q;
                        case 4:
                          a = za(12);
                          J[a >> 2] = 3340;
                          c = za(67108934);
                          J[(a + 4) >> 2] = c;
                          b = za(33554467);
                          J[(a + 8) >> 2] = b;
                          D(c, 0, 67108934);
                          D(b, 0, 33554467);
                          break q;
                        case 5:
                          a = za(12);
                          J[a >> 2] = 3448;
                          c = za(134217758);
                          J[(a + 4) >> 2] = c;
                          b = za(67108879);
                          J[(a + 8) >> 2] = b;
                          D(c, 0, 134217758);
                          D(b, 0, 67108879);
                          break q;
                        case 6:
                          a = za(12);
                          J[a >> 2] = 3556;
                          c = za(268435514);
                          J[(a + 4) >> 2] = c;
                          b = za(134217757);
                          J[(a + 8) >> 2] = b;
                          D(c, 0, 268435514);
                          D(b, 0, 134217757);
                          break q;
                        default:
                          break r;
                      }
                    }
                    wc(Bc(cc(19716, 2105), a));
                    a = 0;
                  }
                  break j;
                }
                s: {
                  t: {
                    switch ((a - 21) | 0) {
                      case 0:
                        a = za(12);
                        J[a >> 2] = 3664;
                        c = za(8388676);
                        J[(a + 4) >> 2] = c;
                        b = za(2097169);
                        J[(a + 8) >> 2] = b;
                        D(c, 0, 8388676);
                        D(b, 0, 2097169);
                        break s;
                      case 1:
                        a = za(12);
                        J[a >> 2] = 3772;
                        c = za(16777276);
                        J[(a + 4) >> 2] = c;
                        b = za(4194319);
                        J[(a + 8) >> 2] = b;
                        D(c, 0, 16777276);
                        D(b, 0, 4194319);
                        break s;
                      case 2:
                        a = za(12);
                        J[a >> 2] = 3880;
                        c = za(33554468);
                        J[(a + 4) >> 2] = c;
                        b = za(8388617);
                        J[(a + 8) >> 2] = b;
                        D(c, 0, 33554468);
                        D(b, 0, 8388617);
                        break s;
                      case 3:
                        a = of(za(12));
                        break s;
                      case 4:
                        a = za(12);
                        J[a >> 2] = 3988;
                        c = za(134217868);
                        J[(a + 4) >> 2] = c;
                        b = za(33554467);
                        J[(a + 8) >> 2] = b;
                        D(c, 0, 134217868);
                        D(b, 0, 33554467);
                        break s;
                      case 5:
                        a = za(12);
                        J[a >> 2] = 4096;
                        c = za(268435516);
                        J[(a + 4) >> 2] = c;
                        b = za(67108879);
                        J[(a + 8) >> 2] = b;
                        D(c, 0, 268435516);
                        D(b, 0, 67108879);
                        break s;
                      case 6:
                        a = za(12);
                        J[a >> 2] = 4204;
                        c = za(536871028);
                        J[(a + 4) >> 2] = c;
                        b = za(134217757);
                        J[(a + 8) >> 2] = b;
                        D(c, 0, 536871028);
                        D(b, 0, 134217757);
                        break s;
                      default:
                        break t;
                    }
                  }
                  wc(Bc(cc(19716, 2105), a));
                  a = 0;
                }
                break j;
              }
              wc(cc(Bc(cc(19716, 2077), c), 1458));
              a = 0;
            }
            J[4143] = a;
            if (a) {
              c = oa[J[J[a >> 2] >> 2]](a) | 0;
              a = J[4143];
              zb(d, c, P(oa[J[(J[a >> 2] + 8) >> 2]](a) | 0, H[(f + 11) | 0]));
              a = J[4143];
              c = oa[J[(J[a >> 2] + 4) >> 2]](a) | 0;
              a = J[4143];
              zb(d, c, P(oa[J[(J[a >> 2] + 8) >> 2]](a) | 0, H[(f + 12) | 0]));
              if (K[(((J[(J[d >> 2] - 12) >> 2] + d) | 0) + 16) | 0] & 5) {
                break i;
              }
              J[4146] = H[(f + 13) | 0];
            }
            if (!Cf((d + 8) | 0)) {
              ob((J[(J[d >> 2] - 12) >> 2] + d) | 0, 4);
            }
          }
          zc(d);
          ka = (f + 208) | 0;
          ya(j);
          ka = (k + 16) | 0;
          ya(m);
          ya(l);
          ka = (i + 32) | 0;
        }
        function Fa(a, b, c, d, e, f, g, h, i) {
          var j = 0,
            k = 0,
            l = 0,
            m = 0,
            n = 0,
            o = 0,
            p = 0,
            q = 0,
            r = 0,
            s = 0,
            t = 0,
            u = 0,
            v = 0,
            w = 0,
            x = 0,
            y = 0,
            z = 0,
            A = 0,
            B = 0,
            C = 0;
          l = (ka - 96) | 0;
          ka = l;
          o = i & 65535;
          p = (e ^ i) & -2147483648;
          k = e & 65535;
          v = k;
          s = (i >>> 16) & 32767;
          q = (e >>> 16) & 32767;
          a: {
            b: {
              if (
                ((s - 32767) >>> 0 > 4294934529) &
                ((q - 32767) >>> 0 >= 4294934530)
              ) {
                break b;
              }
              r = e & 2147483647;
              t = r;
              j = d;
              if (
                !(!j & ((r | 0) == 2147418112)
                  ? !(b | c)
                  : r >>> 0 < 2147418112)
              ) {
                n = j;
                p = e | 32768;
                break a;
              }
              r = i & 2147483647;
              e = h;
              if (
                !(!e & ((r | 0) == 2147418112)
                  ? !(f | g)
                  : r >>> 0 < 2147418112)
              ) {
                n = e;
                p = i | 32768;
                b = f;
                c = g;
                break a;
              }
              if (!(b | j | ((t ^ 2147418112) | c))) {
                if (!(e | f | (g | r))) {
                  p = 2147450880;
                  b = 0;
                  c = 0;
                  break a;
                }
                p = p | 2147418112;
                b = 0;
                c = 0;
                break a;
              }
              if (!(e | f | ((r ^ 2147418112) | g))) {
                e = b | j;
                d = c | t;
                b = 0;
                c = 0;
                if (!(d | e)) {
                  p = 2147450880;
                  break a;
                }
                p = p | 2147418112;
                break a;
              }
              if (!(b | j | (c | t))) {
                b = 0;
                c = 0;
                break a;
              }
              if (!(e | f | (g | r))) {
                b = 0;
                c = 0;
                break a;
              }
              if (((t | 0) == 65535) | (t >>> 0 < 65535)) {
                j = !(d | k);
                i = S(j ? c : k);
                j =
                  (((i | 0) == 32 ? (S(j ? b : d) + 32) | 0 : i) +
                    (j ? 64 : 0)) |
                  0;
                Ta((l + 80) | 0, b, c, d, k, (j - 15) | 0);
                u = (16 - j) | 0;
                d = J[(l + 88) >> 2];
                v = J[(l + 92) >> 2];
                c = J[(l + 84) >> 2];
                b = J[(l + 80) >> 2];
              }
              if (r >>> 0 > 65535) {
                break b;
              }
              i = !(h | o);
              e = S(i ? g : o);
              i =
                (((e | 0) == 32 ? (S(i ? f : h) + 32) | 0 : e) + (i ? 64 : 0)) |
                0;
              Ta((l - -64) | 0, f, g, h, o, (i - 15) | 0);
              u = (((u - i) | 0) + 16) | 0;
              h = J[(l + 72) >> 2];
              o = J[(l + 76) >> 2];
              f = J[(l + 64) >> 2];
              g = J[(l + 68) >> 2];
            }
            u = (((((q + s) | 0) + u) | 0) - 16383) | 0;
            i = h << 15;
            k = 0;
            x = (o << 15) | (h >>> 17) | -2147483648;
            B = c;
            h = dk(x, k, c, 0);
            c = na;
            r = f << 15;
            y = (g << 15) | (f >>> 17);
            s = 0;
            w = v | 65536;
            q = m;
            f = dk(y, s, w, m);
            e = (f + h) | 0;
            j = (na + c) | 0;
            j = e >>> 0 < f >>> 0 ? (j + 1) | 0 : j;
            f = j;
            h =
              (((c | 0) == (j | 0)) & (e >>> 0 < h >>> 0)) |
              (c >>> 0 > j >>> 0);
            z = i | (g >>> 17);
            o = d;
            d = dk(z, 0, d, 0);
            c = (d + e) | 0;
            j = (na + j) | 0;
            j = c >>> 0 < d >>> 0 ? (j + 1) | 0 : j;
            d =
              (((f | 0) == (j | 0)) & (c >>> 0 < e >>> 0)) |
              (f >>> 0 > j >>> 0);
            e = d;
            d = (d + h) | 0;
            k = e >>> 0 > d >>> 0 ? 1 : k;
            e = d;
            d = dk(x, s, w, m);
            e = (e + d) | 0;
            i = (na + k) | 0;
            i = d >>> 0 > e >>> 0 ? (i + 1) | 0 : i;
            t = e;
            g = c;
            d = c;
            m = j;
            A = r & -32768;
            c = dk(A, 0, o, n);
            h = na;
            e = dk(B, s, y, s);
            f = (e + c) | 0;
            j = (na + h) | 0;
            j = e >>> 0 > f >>> 0 ? (j + 1) | 0 : j;
            v =
              (((h | 0) == (j | 0)) & (c >>> 0 > f >>> 0)) |
              (h >>> 0 > j >>> 0);
            e = j;
            c = f;
            r = b;
            b = dk(z, n, b, 0);
            f = (c + b) | 0;
            j = (na + j) | 0;
            k = 0;
            j = b >>> 0 > f >>> 0 ? (j + 1) | 0 : j;
            h = j;
            b =
              (((j | 0) == (e | 0)) & (c >>> 0 > f >>> 0)) |
              (e >>> 0 > j >>> 0);
            c = b;
            b = (b + v) | 0;
            j = ((c >>> 0 > b >>> 0 ? 1 : k) + m) | 0;
            e = (b + d) | 0;
            j = e >>> 0 < b >>> 0 ? (j + 1) | 0 : j;
            d = j;
            b =
              (((j | 0) == (m | 0)) & (e >>> 0 < g >>> 0)) |
              (j >>> 0 < m >>> 0);
            j = i;
            c = b;
            b = (b + t) | 0;
            j = c >>> 0 > b >>> 0 ? (j + 1) | 0 : j;
            m = b;
            k = j;
            g = dk(z, n, w, q);
            j = na;
            c = dk(x, s, o, n);
            b = (c + g) | 0;
            i = (na + j) | 0;
            i = b >>> 0 < c >>> 0 ? (i + 1) | 0 : i;
            c = i;
            j =
              (((((j | 0) == (c | 0)) & (b >>> 0 < g >>> 0)) |
                (c >>> 0 < j >>> 0)) +
                k) |
              0;
            m = (c + m) | 0;
            i = c >>> 0 > m >>> 0 ? (j + 1) | 0 : j;
            k = d;
            g = d;
            j = b;
            b = 0;
            d = (b + e) | 0;
            j = (g + j) | 0;
            j = b >>> 0 > d >>> 0 ? (j + 1) | 0 : j;
            g = j;
            b =
              (((k | 0) == (j | 0)) & (d >>> 0 < e >>> 0)) |
              (j >>> 0 < k >>> 0);
            c = b;
            b = (b + m) | 0;
            i = c >>> 0 > b >>> 0 ? (i + 1) | 0 : i;
            C = b;
            m = dk(w, q, A, n);
            w = na;
            b = dk(y, s, o, n);
            q = (b + m) | 0;
            j = (na + w) | 0;
            c = dk(r, n, x, s);
            o = (c + q) | 0;
            b = b >>> 0 > q >>> 0 ? (j + 1) | 0 : j;
            j = (b + na) | 0;
            j = c >>> 0 > o >>> 0 ? (j + 1) | 0 : j;
            e = dk(z, n, B, s);
            c = (e + o) | 0;
            v = j;
            k = (j + na) | 0;
            k = c >>> 0 < e >>> 0 ? (k + 1) | 0 : k;
            e = 0;
            t =
              (((k | 0) == (j | 0)) & (c >>> 0 < o >>> 0)) |
              (k >>> 0 < j >>> 0);
            m =
              (((b | 0) == (w | 0)) & (m >>> 0 > q >>> 0)) |
              (b >>> 0 < w >>> 0);
            b =
              (((b | 0) == (v | 0)) & (o >>> 0 < q >>> 0)) |
              (b >>> 0 > v >>> 0);
            b = (b + m) | 0;
            b = (b + t) | 0;
            j = b;
            b = (k + d) | 0;
            j = ((e | j) + g) | 0;
            e = b;
            j = b >>> 0 < k >>> 0 ? (j + 1) | 0 : j;
            q = j;
            b =
              (((g | 0) == (j | 0)) & (b >>> 0 < d >>> 0)) |
              (g >>> 0 > j >>> 0);
            j = i;
            d = b;
            b = (b + C) | 0;
            j = d >>> 0 > b >>> 0 ? (j + 1) | 0 : j;
            v = b;
            d = j;
            m = dk(B, s, A, n);
            t = na;
            g = dk(r, n, y, s);
            b = (g + m) | 0;
            i = (na + t) | 0;
            i = b >>> 0 < g >>> 0 ? (i + 1) | 0 : i;
            g = 0;
            j =
              (((i | 0) == (t | 0)) & (b >>> 0 < m >>> 0)) |
              (i >>> 0 < t >>> 0);
            m = i;
            i = (i + f) | 0;
            j = ((g | j) + h) | 0;
            j = i >>> 0 < m >>> 0 ? (j + 1) | 0 : j;
            s =
              (((h | 0) == (j | 0)) & (f >>> 0 > i >>> 0)) |
              (h >>> 0 > j >>> 0);
            f = j;
            j = c;
            c = 0;
            g = (c + i) | 0;
            k = (f + j) | 0;
            k = c >>> 0 > g >>> 0 ? (k + 1) | 0 : k;
            h = k;
            c =
              (((f | 0) == (k | 0)) & (g >>> 0 < i >>> 0)) |
              (k >>> 0 < f >>> 0);
            i = 0;
            f = c;
            c = (c + s) | 0;
            j = ((f >>> 0 > c >>> 0 ? 1 : i) + q) | 0;
            f = (c + e) | 0;
            j = f >>> 0 < c >>> 0 ? (j + 1) | 0 : j;
            m = j;
            c =
              (((q | 0) == (j | 0)) & (e >>> 0 > f >>> 0)) |
              (j >>> 0 < q >>> 0);
            e = c;
            c = (c + v) | 0;
            k = e >>> 0 > c >>> 0 ? (d + 1) | 0 : d;
            q = c;
            i = j;
            d = h;
            j = b;
            o = 0;
            c = dk(r, n, A, n);
            b = (o + c) | 0;
            e = j;
            j = (j + na) | 0;
            j = b >>> 0 < c >>> 0 ? (j + 1) | 0 : j;
            c = j;
            e =
              (((e | 0) == (j | 0)) & (b >>> 0 < o >>> 0)) |
              (e >>> 0 > j >>> 0);
            j = d;
            d = (e + g) | 0;
            j = d >>> 0 < e >>> 0 ? (j + 1) | 0 : j;
            e = j;
            g =
              (((h | 0) == (j | 0)) & (d >>> 0 < g >>> 0)) |
              (h >>> 0 > j >>> 0);
            h = (f + g) | 0;
            i = g >>> 0 > h >>> 0 ? (i + 1) | 0 : i;
            j = k;
            f =
              (((i | 0) == (m | 0)) & (f >>> 0 > h >>> 0)) |
              (i >>> 0 < m >>> 0);
            g = f;
            f = (f + q) | 0;
            j = g >>> 0 > f >>> 0 ? (j + 1) | 0 : j;
            g = j;
            c: {
              if (j & 65536) {
                u = (u + 1) | 0;
                break c;
              }
              m = (c >>> 31) | 0;
              k = 0;
              j = (g << 1) | (f >>> 31);
              f = (f << 1) | (i >>> 31);
              g = j;
              j = (i << 1) | (h >>> 31);
              h = (h << 1) | (e >>> 31);
              i = j;
              j = (c << 1) | (b >>> 31);
              b = b << 1;
              c = j;
              j = (e << 1) | (d >>> 31);
              d = (d << 1) | m;
              e = j | k;
            }
            if ((u | 0) >= 32767) {
              p = p | 2147418112;
              b = 0;
              c = 0;
              break a;
            }
            d: {
              if ((u | 0) <= 0) {
                k = (1 - u) | 0;
                if (k >>> 0 <= 127) {
                  j = (u + 127) | 0;
                  Ta((l + 48) | 0, b, c, d, e, j);
                  Ta((l + 32) | 0, h, i, f, g, j);
                  Gb((l + 16) | 0, b, c, d, e, k);
                  Gb(l, h, i, f, g, k);
                  b =
                    J[(l + 32) >> 2] |
                    J[(l + 16) >> 2] |
                    ((J[(l + 48) >> 2] |
                      J[(l + 56) >> 2] |
                      (J[(l + 52) >> 2] | J[(l + 60) >> 2])) !=
                      0);
                  c = J[(l + 36) >> 2] | J[(l + 20) >> 2];
                  d = J[(l + 40) >> 2] | J[(l + 24) >> 2];
                  e = J[(l + 44) >> 2] | J[(l + 28) >> 2];
                  h = J[l >> 2];
                  i = J[(l + 4) >> 2];
                  g = J[(l + 12) >> 2];
                  f = J[(l + 8) >> 2];
                  break d;
                }
                b = 0;
                c = 0;
                break a;
              }
              g = (g & 65535) | (u << 16);
            }
            n = f | n;
            p = g | p;
            if (
              !(!d & ((e | 0) == -2147483648)
                ? !(b | c)
                : ((e | 0) > 0) | ((e | 0) >= 0))
            ) {
              j = i;
              b = (h + 1) | 0;
              j = b ? j : (j + 1) | 0;
              i = p;
              c = j;
              d = !(j | b);
              n = (d + n) | 0;
              p = d >>> 0 > n >>> 0 ? (i + 1) | 0 : i;
              break a;
            }
            if (b | d | ((e ^ -2147483648) | c)) {
              b = h;
              c = i;
              break a;
            }
            k = p;
            j = i;
            b = h & 1;
            c = b;
            b = (b + h) | 0;
            j = c >>> 0 > b >>> 0 ? (j + 1) | 0 : j;
            c = j;
            d =
              (((i | 0) == (j | 0)) & (b >>> 0 < h >>> 0)) |
              (i >>> 0 > j >>> 0);
            n = (d + n) | 0;
            p = d >>> 0 > n >>> 0 ? (k + 1) | 0 : k;
          }
          J[a >> 2] = b;
          J[(a + 4) >> 2] = c;
          J[(a + 8) >> 2] = n;
          J[(a + 12) >> 2] = p;
          ka = (l + 96) | 0;
        }
        function Ah(a, b, c, d, e, f, g, h) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          f = f | 0;
          g = g | 0;
          h = h | 0;
          var i = 0,
            j = 0,
            k = 0,
            l = 0,
            m = 0,
            n = 0,
            o = 0,
            p = 0,
            q = 0,
            r = 0,
            s = 0,
            t = 0,
            u = 0,
            v = 0,
            w = 0,
            x = 0,
            y = 0,
            z = 0,
            A = 0,
            B = 0;
          x = (ka - 16) | 0;
          ka = x;
          p = c;
          while (1) {
            a: {
              if ((d | 0) == (p | 0)) {
                p = d;
                break a;
              }
              if (!K[p | 0]) {
                break a;
              }
              p = (p + 1) | 0;
              continue;
            }
            break;
          }
          J[h >> 2] = f;
          J[e >> 2] = c;
          b: while (1) {
            c: {
              d: {
                e: {
                  if (((c | 0) == (d | 0)) | ((f | 0) == (g | 0))) {
                    break e;
                  }
                  q = J[(b + 4) >> 2];
                  J[(x + 8) >> 2] = J[b >> 2];
                  J[(x + 12) >> 2] = q;
                  z = (ka - 16) | 0;
                  ka = z;
                  ((A = z), (B = tb(J[(a + 8) >> 2])), (J[(A + 12) >> 2] = B));
                  u = (p - c) | 0;
                  r = 0;
                  t = (ka - 1040) | 0;
                  ka = t;
                  q = J[e >> 2];
                  J[(t + 12) >> 2] = q;
                  v = f ? f : (t + 16) | 0;
                  s = f ? (g - f) >> 2 : 256;
                  f: {
                    g: {
                      h: {
                        if (!(!q | !s)) {
                          while (1) {
                            l = (u >>> 2) | 0;
                            if (!((u >>> 0 > 131) | (l >>> 0 >= s >>> 0))) {
                              l = q;
                              break g;
                            }
                            n = v;
                            l = l >>> 0 < s >>> 0 ? l : s;
                            j = 0;
                            k = 0;
                            y = (t + 12) | 0;
                            i = J[y >> 2];
                            i: {
                              j: {
                                k: {
                                  l: {
                                    m: {
                                      n: {
                                        o: {
                                          p: {
                                            q: {
                                              r: {
                                                s: {
                                                  t: {
                                                    u: {
                                                      if (!b) {
                                                        break u;
                                                      }
                                                      k = J[b >> 2];
                                                      if (!k) {
                                                        break u;
                                                      }
                                                      if (!n) {
                                                        m = l;
                                                        break s;
                                                      }
                                                      J[b >> 2] = 0;
                                                      m = l;
                                                      break t;
                                                    }
                                                    v: {
                                                      if (!J[J[4844] >> 2]) {
                                                        if (!n) {
                                                          break v;
                                                        }
                                                        if (!l) {
                                                          break j;
                                                        }
                                                        k = l;
                                                        while (1) {
                                                          m = H[i | 0];
                                                          if (m) {
                                                            J[n >> 2] =
                                                              m & 57343;
                                                            n = (n + 4) | 0;
                                                            i = (i + 1) | 0;
                                                            k = (k - 1) | 0;
                                                            if (k) {
                                                              continue;
                                                            }
                                                            break j;
                                                          }
                                                          break;
                                                        }
                                                        J[n >> 2] = 0;
                                                        J[y >> 2] = 0;
                                                        l = (l - k) | 0;
                                                        break i;
                                                      }
                                                      m = l;
                                                      if (!n) {
                                                        break r;
                                                      }
                                                      break p;
                                                    }
                                                    l = Sb(i);
                                                    break i;
                                                  }
                                                  j = 1;
                                                  break p;
                                                }
                                                j = 0;
                                                break q;
                                              }
                                              j = 1;
                                            }
                                            while (1) {
                                              if (!j) {
                                                j = (K[i | 0] >>> 3) | 0;
                                                if (
                                                  ((j - 16) |
                                                    (j + (k >> 26))) >>>
                                                    0 >
                                                  7
                                                ) {
                                                  break o;
                                                }
                                                j = (i + 1) | 0;
                                                w: {
                                                  if (!(k & 33554432)) {
                                                    break w;
                                                  }
                                                  if (H[j | 0] >= -64) {
                                                    i = (i - 1) | 0;
                                                    break m;
                                                  }
                                                  j = (i + 2) | 0;
                                                  if (!(k & 524288)) {
                                                    break w;
                                                  }
                                                  if (H[j | 0] >= -64) {
                                                    i = (i - 1) | 0;
                                                    break m;
                                                  }
                                                  j = (i + 3) | 0;
                                                }
                                                i = j;
                                                m = (m - 1) | 0;
                                                j = 1;
                                                continue;
                                              }
                                              while (1) {
                                                k = H[i | 0];
                                                x: {
                                                  if (
                                                    (i & 3) |
                                                    ((k | 0) <= 0)
                                                  ) {
                                                    break x;
                                                  }
                                                  k = J[i >> 2];
                                                  if (
                                                    (k | (k - 16843009)) &
                                                    -2139062144
                                                  ) {
                                                    break x;
                                                  }
                                                  while (1) {
                                                    m = (m - 4) | 0;
                                                    k = i;
                                                    i = (i + 4) | 0;
                                                    k = J[(k + 4) >> 2];
                                                    if (
                                                      !(
                                                        (k | (k - 16843009)) &
                                                        -2139062144
                                                      )
                                                    ) {
                                                      continue;
                                                    }
                                                    break;
                                                  }
                                                }
                                                if ((k << 24) >> 24 > 0) {
                                                  m = (m - 1) | 0;
                                                  i = (i + 1) | 0;
                                                  continue;
                                                }
                                                break;
                                              }
                                              j = ((k & 255) - 194) | 0;
                                              if (j >>> 0 > 50) {
                                                break n;
                                              }
                                              i = (i + 1) | 0;
                                              k = J[((j << 2) + 5568) >> 2];
                                              j = 0;
                                              continue;
                                            }
                                          }
                                          while (1) {
                                            if (!j) {
                                              if (!m) {
                                                break j;
                                              }
                                              while (1) {
                                                y: {
                                                  j = K[i | 0];
                                                  k = (j << 24) >> 24;
                                                  if ((k | 0) <= 0) {
                                                    break y;
                                                  }
                                                  if (
                                                    !((i & 3) | (m >>> 0 < 5))
                                                  ) {
                                                    z: {
                                                      while (1) {
                                                        k = J[i >> 2];
                                                        if (
                                                          (k | (k - 16843009)) &
                                                          -2139062144
                                                        ) {
                                                          break z;
                                                        }
                                                        J[n >> 2] = k & 255;
                                                        J[(n + 4) >> 2] =
                                                          K[(i + 1) | 0];
                                                        J[(n + 8) >> 2] =
                                                          K[(i + 2) | 0];
                                                        J[(n + 12) >> 2] =
                                                          K[(i + 3) | 0];
                                                        n = (n + 16) | 0;
                                                        i = (i + 4) | 0;
                                                        m = (m - 4) | 0;
                                                        if (m >>> 0 > 4) {
                                                          continue;
                                                        }
                                                        break;
                                                      }
                                                      k = K[i | 0];
                                                    }
                                                    j = k & 255;
                                                    if ((k << 24) >> 24 <= 0) {
                                                      break y;
                                                    }
                                                  }
                                                  J[n >> 2] = j;
                                                  n = (n + 4) | 0;
                                                  i = (i + 1) | 0;
                                                  m = (m - 1) | 0;
                                                  if (m) {
                                                    continue;
                                                  }
                                                  break j;
                                                }
                                                break;
                                              }
                                              j = (j - 194) | 0;
                                              if (j >>> 0 > 50) {
                                                break n;
                                              }
                                              i = (i + 1) | 0;
                                              k = J[((j << 2) + 5568) >> 2];
                                              j = 1;
                                              continue;
                                            }
                                            j = K[i | 0];
                                            o = (j >>> 3) | 0;
                                            if (
                                              ((o - 16) | (o + (k >> 26))) >>>
                                                0 >
                                              7
                                            ) {
                                              break o;
                                            }
                                            A: {
                                              B: {
                                                o = (i + 1) | 0;
                                                j = (j - 128) | (k << 6);
                                                w = o;
                                                C: {
                                                  if ((j | 0) >= 0) {
                                                    break C;
                                                  }
                                                  o = (K[o | 0] - 128) | 0;
                                                  if (o >>> 0 > 63) {
                                                    break B;
                                                  }
                                                  w = o;
                                                  o = j << 6;
                                                  j = w | o;
                                                  w = (i + 2) | 0;
                                                  if ((o | 0) >= 0) {
                                                    break C;
                                                  }
                                                  o = (K[w | 0] - 128) | 0;
                                                  if (o >>> 0 > 63) {
                                                    break B;
                                                  }
                                                  j = o | (j << 6);
                                                  w = (i + 3) | 0;
                                                }
                                                i = w;
                                                J[n >> 2] = j;
                                                m = (m - 1) | 0;
                                                n = (n + 4) | 0;
                                                break A;
                                              }
                                              J[4158] = 25;
                                              i = (i - 1) | 0;
                                              break l;
                                            }
                                            j = 0;
                                            continue;
                                          }
                                        }
                                        i = (i - 1) | 0;
                                        if (k) {
                                          break m;
                                        }
                                        k = K[i | 0];
                                      }
                                      if (k & 255) {
                                        break m;
                                      }
                                      if (n) {
                                        J[n >> 2] = 0;
                                        J[y >> 2] = 0;
                                      }
                                      l = (l - m) | 0;
                                      break i;
                                    }
                                    J[4158] = 25;
                                    if (!n) {
                                      break k;
                                    }
                                  }
                                  J[y >> 2] = i;
                                }
                                l = -1;
                                break i;
                              }
                              J[y >> 2] = i;
                            }
                            m = l;
                            l = J[(t + 12) >> 2];
                            if ((m | 0) == -1) {
                              s = 0;
                              r = -1;
                              break h;
                            }
                            i = ((t + 16) | 0) != (v | 0) ? m : 0;
                            s = (s - i) | 0;
                            v = ((i << 2) + v) | 0;
                            u = l ? (((q + u) | 0) - l) | 0 : 0;
                            r = (m + r) | 0;
                            if (!l) {
                              break h;
                            }
                            q = l;
                            if (s) {
                              continue;
                            }
                            break h;
                          }
                        }
                        l = q;
                      }
                      if (!l) {
                        break f;
                      }
                    }
                    if (!s | !u) {
                      break f;
                    }
                    q = r;
                    while (1) {
                      D: {
                        r = bc(v, l, u, b);
                        E: {
                          if ((r + 2) >>> 0 <= 2) {
                            F: {
                              switch ((r + 1) | 0) {
                                case 1:
                                  J[(t + 12) >> 2] = 0;
                                  break E;
                                case 0:
                                  break f;
                                default:
                                  break F;
                              }
                            }
                            J[b >> 2] = 0;
                            break E;
                          }
                          l = (J[(t + 12) >> 2] + r) | 0;
                          J[(t + 12) >> 2] = l;
                          q = (q + 1) | 0;
                          s = (s - 1) | 0;
                          if (s) {
                            break D;
                          }
                        }
                        r = q;
                        break f;
                      }
                      v = (v + 4) | 0;
                      u = (u - r) | 0;
                      r = q;
                      if (u) {
                        continue;
                      }
                      break;
                    }
                  }
                  if (f) {
                    J[e >> 2] = J[(t + 12) >> 2];
                  }
                  ka = (t + 1040) | 0;
                  wb((z + 12) | 0);
                  ka = (z + 16) | 0;
                  G: {
                    H: {
                      I: {
                        J: {
                          if ((r | 0) == -1) {
                            while (1) {
                              K: {
                                J[h >> 2] = f;
                                if (J[e >> 2] == (c | 0)) {
                                  break K;
                                }
                                g = 1;
                                L: {
                                  M: {
                                    N: {
                                      b = ge(
                                        f,
                                        c,
                                        (p - c) | 0,
                                        (x + 8) | 0,
                                        J[(a + 8) >> 2],
                                      );
                                      switch ((b + 2) | 0) {
                                        case 0:
                                          break H;
                                        case 1:
                                          break N;
                                        case 2:
                                          break L;
                                        default:
                                          break M;
                                      }
                                    }
                                    J[e >> 2] = c;
                                    break J;
                                  }
                                  g = b;
                                }
                                c = (c + g) | 0;
                                f = (J[h >> 2] + 4) | 0;
                                continue;
                              }
                              break;
                            }
                            J[e >> 2] = c;
                            break e;
                          }
                          f = (J[h >> 2] + (r << 2)) | 0;
                          J[h >> 2] = f;
                          if ((f | 0) == (g | 0)) {
                            break G;
                          }
                          c = J[e >> 2];
                          if ((d | 0) == (p | 0)) {
                            break c;
                          }
                          if (!ge(f, c, 1, b, J[(a + 8) >> 2])) {
                            break I;
                          }
                        }
                        a = 2;
                        break d;
                      }
                      f = (J[h >> 2] + 4) | 0;
                      J[h >> 2] = f;
                      c = (J[e >> 2] + 1) | 0;
                      J[e >> 2] = c;
                      p = c;
                      while (1) {
                        if ((d | 0) == (p | 0)) {
                          break c;
                        }
                        if (!K[p | 0]) {
                          continue b;
                        }
                        p = (p + 1) | 0;
                        continue;
                      }
                    }
                    J[e >> 2] = c;
                    a = 1;
                    break d;
                  }
                  c = J[e >> 2];
                }
                a = (c | 0) != (d | 0);
              }
              ka = (x + 16) | 0;
              return a | 0;
            }
            p = d;
            continue;
          }
        }
        function hi(a, b, c, d, e, f, g, h) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          f = f | 0;
          g = g | 0;
          h = h | 0;
          var i = 0,
            j = 0,
            k = 0,
            l = 0,
            m = 0,
            n = 0;
          h = (ka - 48) | 0;
          ka = h;
          J[(h + 44) >> 2] = b;
          J[e >> 2] = 0;
          Ha(h, d);
          i = ib(h);
          Ka(J[h >> 2]);
          a: {
            b: {
              c: {
                d: {
                  switch ((g - 65) | 0) {
                    case 0:
                    case 32:
                      ye(a, (f + 24) | 0, (h + 44) | 0, c, e, i);
                      break b;
                    case 1:
                    case 33:
                    case 39:
                      xe(a, (f + 16) | 0, (h + 44) | 0, c, e, i);
                      break b;
                    case 34:
                      b = oa[J[(J[(a + 8) >> 2] + 12) >> 2]]((a + 8) | 0) | 0;
                      i = H[(b + 11) | 0];
                      g = (i | 0) < 0;
                      j = a;
                      a = g ? J[b >> 2] : b;
                      ((k = h),
                        (l = rb(
                          j,
                          J[(h + 44) >> 2],
                          c,
                          d,
                          e,
                          f,
                          a,
                          (a + ((g ? J[(b + 4) >> 2] : i) << 2)) | 0,
                        )),
                        (J[(k + 44) >> 2] = l));
                      break b;
                    case 35:
                    case 36:
                      a = kb((h + 44) | 0, c, e, i, 2);
                      b = J[e >> 2];
                      e: {
                        if (!((b & 4) | ((a - 1) >>> 0 > 30))) {
                          J[(f + 12) >> 2] = a;
                          break e;
                        }
                        J[e >> 2] = b | 4;
                      }
                      break b;
                    case 3:
                      g = J[1903];
                      J[(h + 24) >> 2] = J[1902];
                      J[(h + 28) >> 2] = g;
                      g = J[1901];
                      J[(h + 16) >> 2] = J[1900];
                      J[(h + 20) >> 2] = g;
                      g = J[1899];
                      J[(h + 8) >> 2] = J[1898];
                      J[(h + 12) >> 2] = g;
                      g = J[1897];
                      J[h >> 2] = J[1896];
                      J[(h + 4) >> 2] = g;
                      ((k = h),
                        (l = rb(a, b, c, d, e, f, h, (h + 32) | 0)),
                        (J[(k + 44) >> 2] = l));
                      break b;
                    case 5:
                      g = J[1911];
                      J[(h + 24) >> 2] = J[1910];
                      J[(h + 28) >> 2] = g;
                      g = J[1909];
                      J[(h + 16) >> 2] = J[1908];
                      J[(h + 20) >> 2] = g;
                      g = J[1907];
                      J[(h + 8) >> 2] = J[1906];
                      J[(h + 12) >> 2] = g;
                      g = J[1905];
                      J[h >> 2] = J[1904];
                      J[(h + 4) >> 2] = g;
                      ((k = h),
                        (l = rb(a, b, c, d, e, f, h, (h + 32) | 0)),
                        (J[(k + 44) >> 2] = l));
                      break b;
                    case 7:
                      a = kb((h + 44) | 0, c, e, i, 2);
                      b = J[e >> 2];
                      f: {
                        if (!((b & 4) | ((a | 0) > 23))) {
                          J[(f + 8) >> 2] = a;
                          break f;
                        }
                        J[e >> 2] = b | 4;
                      }
                      break b;
                    case 8:
                      a = kb((h + 44) | 0, c, e, i, 2);
                      b = J[e >> 2];
                      g: {
                        if (!((b & 4) | ((a - 1) >>> 0 > 11))) {
                          J[(f + 8) >> 2] = a;
                          break g;
                        }
                        J[e >> 2] = b | 4;
                      }
                      break b;
                    case 41:
                      a = kb((h + 44) | 0, c, e, i, 3);
                      b = J[e >> 2];
                      h: {
                        if (!((b & 4) | ((a | 0) > 365))) {
                          J[(f + 28) >> 2] = a;
                          break h;
                        }
                        J[e >> 2] = b | 4;
                      }
                      break b;
                    case 44:
                      a = kb((h + 44) | 0, c, e, i, 2);
                      b = J[e >> 2];
                      a = (a - 1) | 0;
                      i: {
                        if (!((b & 4) | (a >>> 0 > 11))) {
                          J[(f + 16) >> 2] = a;
                          break i;
                        }
                        J[e >> 2] = b | 4;
                      }
                      break b;
                    case 12:
                      a = kb((h + 44) | 0, c, e, i, 2);
                      b = J[e >> 2];
                      j: {
                        if (!((b & 4) | ((a | 0) > 59))) {
                          J[(f + 4) >> 2] = a;
                          break j;
                        }
                        J[e >> 2] = b | 4;
                      }
                      break b;
                    case 45:
                    case 51:
                      a = (h + 44) | 0;
                      b = (ka - 16) | 0;
                      ka = b;
                      J[(b + 12) >> 2] = c;
                      while (1) {
                        k: {
                          if (La(a, (b + 12) | 0)) {
                            break k;
                          }
                          if (
                            !((l = i),
                            (m = 1),
                            (n = Xb(a)),
                            (k = J[(J[i >> 2] + 12) >> 2]),
                            oa[k](l | 0, m | 0, n | 0) | 0)
                          ) {
                            break k;
                          }
                          qc(a);
                          continue;
                        }
                        break;
                      }
                      if (La(a, (b + 12) | 0)) {
                        J[e >> 2] = J[e >> 2] | 2;
                      }
                      ka = (b + 16) | 0;
                      break b;
                    case 47:
                      d = (h + 44) | 0;
                      a = oa[J[(J[(a + 8) >> 2] + 8) >> 2]]((a + 8) | 0) | 0;
                      b = H[(a + 11) | 0];
                      g = (b | 0) < 0 ? J[(a + 4) >> 2] : b;
                      b = H[(a + 23) | 0];
                      l: {
                        if (
                          (g | 0) ==
                          ((0 - ((b | 0) < 0 ? J[(a + 16) >> 2] : b)) | 0)
                        ) {
                          J[e >> 2] = J[e >> 2] | 4;
                          break l;
                        }
                        c = rc(d, c, a, (a + 24) | 0, i, e, 0);
                        b = J[(f + 8) >> 2];
                        if (!(((c | 0) != (a | 0)) | ((b | 0) != 12))) {
                          J[(f + 8) >> 2] = 0;
                          break l;
                        }
                        if (!((((c - a) | 0) != 12) | ((b | 0) > 11))) {
                          J[(f + 8) >> 2] = b + 12;
                        }
                      }
                      break b;
                    case 49:
                      z(h, 7648, 44);
                      ((k = h),
                        (n = rb(a, b, c, d, e, f, h, (h + 44) | 0)),
                        (J[(k + 44) >> 2] = n));
                      break b;
                    case 17:
                      J[(h + 16) >> 2] = J[1928];
                      g = J[1927];
                      J[(h + 8) >> 2] = J[1926];
                      J[(h + 12) >> 2] = g;
                      g = J[1925];
                      J[h >> 2] = J[1924];
                      J[(h + 4) >> 2] = g;
                      ((k = h),
                        (n = rb(a, b, c, d, e, f, h, (h + 20) | 0)),
                        (J[(k + 44) >> 2] = n));
                      break b;
                    case 18:
                      a = kb((h + 44) | 0, c, e, i, 2);
                      b = J[e >> 2];
                      m: {
                        if (!((b & 4) | ((a | 0) > 60))) {
                          J[f >> 2] = a;
                          break m;
                        }
                        J[e >> 2] = b | 4;
                      }
                      break b;
                    case 19:
                      g = J[1939];
                      J[(h + 24) >> 2] = J[1938];
                      J[(h + 28) >> 2] = g;
                      g = J[1937];
                      J[(h + 16) >> 2] = J[1936];
                      J[(h + 20) >> 2] = g;
                      g = J[1935];
                      J[(h + 8) >> 2] = J[1934];
                      J[(h + 12) >> 2] = g;
                      g = J[1933];
                      J[h >> 2] = J[1932];
                      J[(h + 4) >> 2] = g;
                      ((k = h),
                        (n = rb(a, b, c, d, e, f, h, (h + 32) | 0)),
                        (J[(k + 44) >> 2] = n));
                      break b;
                    case 54:
                      a = kb((h + 44) | 0, c, e, i, 1);
                      b = J[e >> 2];
                      n: {
                        if (!((b & 4) | ((a | 0) > 6))) {
                          J[(f + 24) >> 2] = a;
                          break n;
                        }
                        J[e >> 2] = b | 4;
                      }
                      break b;
                    case 55:
                      a = oa[J[(J[a >> 2] + 20) >> 2]](a, b, c, d, e, f) | 0;
                      break a;
                    case 23:
                      b = oa[J[(J[(a + 8) >> 2] + 24) >> 2]]((a + 8) | 0) | 0;
                      i = H[(b + 11) | 0];
                      g = (i | 0) < 0;
                      j = a;
                      a = g ? J[b >> 2] : b;
                      ((k = h),
                        (n = rb(
                          j,
                          J[(h + 44) >> 2],
                          c,
                          d,
                          e,
                          f,
                          a,
                          (a + ((g ? J[(b + 4) >> 2] : i) << 2)) | 0,
                        )),
                        (J[(k + 44) >> 2] = n));
                      break b;
                    case 56:
                      we((f + 20) | 0, (h + 44) | 0, c, e, i);
                      break b;
                    case 24:
                      a = kb((h + 44) | 0, c, e, i, 4);
                      if (!(K[e | 0] & 4)) {
                        J[(f + 20) >> 2] = a - 1900;
                      }
                      break b;
                    default:
                      if ((g | 0) == 37) {
                        break c;
                      }
                      break;
                    case 2:
                    case 4:
                    case 6:
                    case 9:
                    case 10:
                    case 11:
                    case 13:
                    case 14:
                    case 15:
                    case 16:
                    case 20:
                    case 21:
                    case 22:
                    case 25:
                    case 26:
                    case 27:
                    case 28:
                    case 29:
                    case 30:
                    case 31:
                    case 37:
                    case 38:
                    case 40:
                    case 42:
                    case 43:
                    case 46:
                    case 48:
                    case 50:
                    case 52:
                    case 53:
                      break d;
                  }
                }
                J[e >> 2] = J[e >> 2] | 4;
                break b;
              }
              a = (ka - 16) | 0;
              ka = a;
              J[(a + 12) >> 2] = c;
              c = (h + 44) | 0;
              d = (a + 12) | 0;
              b = 6;
              o: {
                p: {
                  if (La(c, d)) {
                    break p;
                  }
                  b = 4;
                  if (
                    (((n = i),
                    (m = Xb(c)),
                    (l = 0),
                    (k = J[(J[i >> 2] + 52) >> 2]),
                    oa[k](n | 0, m | 0, l | 0) | 0) |
                      0) !=
                    37
                  ) {
                    break p;
                  }
                  if (!La(qc(c), d)) {
                    break o;
                  }
                  b = 2;
                }
                J[e >> 2] = b | J[e >> 2];
              }
              ka = (a + 16) | 0;
            }
            a = J[(h + 44) >> 2];
          }
          ka = (h + 48) | 0;
          return a | 0;
        }
        function ni(a, b, c, d, e, f, g, h) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          f = f | 0;
          g = g | 0;
          h = h | 0;
          var i = 0,
            j = 0,
            k = 0,
            l = 0,
            m = 0,
            n = 0;
          h = (ka - 16) | 0;
          ka = h;
          J[(h + 12) >> 2] = b;
          J[e >> 2] = 0;
          Ha(h, d);
          i = eb(h);
          Ka(J[h >> 2]);
          a: {
            b: {
              c: {
                d: {
                  switch ((g - 65) | 0) {
                    case 0:
                    case 32:
                      Be(a, (f + 24) | 0, (h + 12) | 0, c, e, i);
                      break b;
                    case 1:
                    case 33:
                    case 39:
                      Ae(a, (f + 16) | 0, (h + 12) | 0, c, e, i);
                      break b;
                    case 34:
                      b = oa[J[(J[(a + 8) >> 2] + 12) >> 2]]((a + 8) | 0) | 0;
                      i = H[(b + 11) | 0];
                      g = (i | 0) < 0;
                      j = a;
                      a = g ? J[b >> 2] : b;
                      ((k = h),
                        (l = sb(
                          j,
                          J[(h + 12) >> 2],
                          c,
                          d,
                          e,
                          f,
                          a,
                          (a + (g ? J[(b + 4) >> 2] : i)) | 0,
                        )),
                        (J[(k + 12) >> 2] = l));
                      break b;
                    case 35:
                    case 36:
                      a = lb((h + 12) | 0, c, e, i, 2);
                      b = J[e >> 2];
                      e: {
                        if (!((b & 4) | ((a - 1) >>> 0 > 30))) {
                          J[(f + 12) >> 2] = a;
                          break e;
                        }
                        J[e >> 2] = b | 4;
                      }
                      break b;
                    case 3:
                      J[h >> 2] = 623865125;
                      J[(h + 4) >> 2] = 2032480100;
                      ((k = h),
                        (l = sb(a, b, c, d, e, f, h, (h + 8) | 0)),
                        (J[(k + 12) >> 2] = l));
                      break b;
                    case 5:
                      J[h >> 2] = 623728933;
                      J[(h + 4) >> 2] = 1680158061;
                      ((k = h),
                        (l = sb(a, b, c, d, e, f, h, (h + 8) | 0)),
                        (J[(k + 12) >> 2] = l));
                      break b;
                    case 7:
                      a = lb((h + 12) | 0, c, e, i, 2);
                      b = J[e >> 2];
                      f: {
                        if (!((b & 4) | ((a | 0) > 23))) {
                          J[(f + 8) >> 2] = a;
                          break f;
                        }
                        J[e >> 2] = b | 4;
                      }
                      break b;
                    case 8:
                      a = lb((h + 12) | 0, c, e, i, 2);
                      b = J[e >> 2];
                      g: {
                        if (!((b & 4) | ((a - 1) >>> 0 > 11))) {
                          J[(f + 8) >> 2] = a;
                          break g;
                        }
                        J[e >> 2] = b | 4;
                      }
                      break b;
                    case 41:
                      a = lb((h + 12) | 0, c, e, i, 3);
                      b = J[e >> 2];
                      h: {
                        if (!((b & 4) | ((a | 0) > 365))) {
                          J[(f + 28) >> 2] = a;
                          break h;
                        }
                        J[e >> 2] = b | 4;
                      }
                      break b;
                    case 44:
                      a = lb((h + 12) | 0, c, e, i, 2);
                      b = J[e >> 2];
                      a = (a - 1) | 0;
                      i: {
                        if (!((b & 4) | (a >>> 0 > 11))) {
                          J[(f + 16) >> 2] = a;
                          break i;
                        }
                        J[e >> 2] = b | 4;
                      }
                      break b;
                    case 12:
                      a = lb((h + 12) | 0, c, e, i, 2);
                      b = J[e >> 2];
                      j: {
                        if (!((b & 4) | ((a | 0) > 59))) {
                          J[(f + 4) >> 2] = a;
                          break j;
                        }
                        J[e >> 2] = b | 4;
                      }
                      break b;
                    case 45:
                    case 51:
                      a = (h + 12) | 0;
                      b = (ka - 16) | 0;
                      ka = b;
                      J[(b + 12) >> 2] = c;
                      while (1) {
                        k: {
                          if (Ma(a, (b + 12) | 0)) {
                            break k;
                          }
                          c = _b(a);
                          if (
                            ((c | 0) < 0) |
                            !(H[(J[(i + 8) >> 2] + (c << 2)) | 0] & 1)
                          ) {
                            break k;
                          }
                          sc(a);
                          continue;
                        }
                        break;
                      }
                      if (Ma(a, (b + 12) | 0)) {
                        J[e >> 2] = J[e >> 2] | 2;
                      }
                      ka = (b + 16) | 0;
                      break b;
                    case 47:
                      d = (h + 12) | 0;
                      a = oa[J[(J[(a + 8) >> 2] + 8) >> 2]]((a + 8) | 0) | 0;
                      b = H[(a + 11) | 0];
                      g = (b | 0) < 0 ? J[(a + 4) >> 2] : b;
                      b = H[(a + 23) | 0];
                      l: {
                        if (
                          (g | 0) ==
                          ((0 - ((b | 0) < 0 ? J[(a + 16) >> 2] : b)) | 0)
                        ) {
                          J[e >> 2] = J[e >> 2] | 4;
                          break l;
                        }
                        c = tc(d, c, a, (a + 24) | 0, i, e, 0);
                        b = J[(f + 8) >> 2];
                        if (!(((c | 0) != (a | 0)) | ((b | 0) != 12))) {
                          J[(f + 8) >> 2] = 0;
                          break l;
                        }
                        if (!((((c - a) | 0) != 12) | ((b | 0) > 11))) {
                          J[(f + 8) >> 2] = b + 12;
                        }
                      }
                      break b;
                    case 49:
                      g =
                        K[7560] |
                        (K[7561] << 8) |
                        ((K[7562] << 16) | (K[7563] << 24));
                      H[(h + 7) | 0] = g;
                      H[(h + 8) | 0] = g >>> 8;
                      H[(h + 9) | 0] = g >>> 16;
                      H[(h + 10) | 0] = g >>> 24;
                      g =
                        K[7557] |
                        (K[7558] << 8) |
                        ((K[7559] << 16) | (K[7560] << 24));
                      J[h >> 2] =
                        K[7553] |
                        (K[7554] << 8) |
                        ((K[7555] << 16) | (K[7556] << 24));
                      J[(h + 4) >> 2] = g;
                      ((k = h),
                        (l = sb(a, b, c, d, e, f, h, (h + 11) | 0)),
                        (J[(k + 12) >> 2] = l));
                      break b;
                    case 17:
                      H[(h + 4) | 0] = K[7568];
                      J[h >> 2] =
                        K[7564] |
                        (K[7565] << 8) |
                        ((K[7566] << 16) | (K[7567] << 24));
                      ((k = h),
                        (l = sb(a, b, c, d, e, f, h, (h + 5) | 0)),
                        (J[(k + 12) >> 2] = l));
                      break b;
                    case 18:
                      a = lb((h + 12) | 0, c, e, i, 2);
                      b = J[e >> 2];
                      m: {
                        if (!((b & 4) | ((a | 0) > 60))) {
                          J[f >> 2] = a;
                          break m;
                        }
                        J[e >> 2] = b | 4;
                      }
                      break b;
                    case 19:
                      J[h >> 2] = 624576549;
                      J[(h + 4) >> 2] = 1394948685;
                      ((k = h),
                        (l = sb(a, b, c, d, e, f, h, (h + 8) | 0)),
                        (J[(k + 12) >> 2] = l));
                      break b;
                    case 54:
                      a = lb((h + 12) | 0, c, e, i, 1);
                      b = J[e >> 2];
                      n: {
                        if (!((b & 4) | ((a | 0) > 6))) {
                          J[(f + 24) >> 2] = a;
                          break n;
                        }
                        J[e >> 2] = b | 4;
                      }
                      break b;
                    case 55:
                      a = oa[J[(J[a >> 2] + 20) >> 2]](a, b, c, d, e, f) | 0;
                      break a;
                    case 23:
                      b = oa[J[(J[(a + 8) >> 2] + 24) >> 2]]((a + 8) | 0) | 0;
                      i = H[(b + 11) | 0];
                      g = (i | 0) < 0;
                      j = a;
                      a = g ? J[b >> 2] : b;
                      ((k = h),
                        (l = sb(
                          j,
                          J[(h + 12) >> 2],
                          c,
                          d,
                          e,
                          f,
                          a,
                          (a + (g ? J[(b + 4) >> 2] : i)) | 0,
                        )),
                        (J[(k + 12) >> 2] = l));
                      break b;
                    case 56:
                      ze((f + 20) | 0, (h + 12) | 0, c, e, i);
                      break b;
                    case 24:
                      a = lb((h + 12) | 0, c, e, i, 4);
                      if (!(K[e | 0] & 4)) {
                        J[(f + 20) >> 2] = a - 1900;
                      }
                      break b;
                    default:
                      if ((g | 0) == 37) {
                        break c;
                      }
                      break;
                    case 2:
                    case 4:
                    case 6:
                    case 9:
                    case 10:
                    case 11:
                    case 13:
                    case 14:
                    case 15:
                    case 16:
                    case 20:
                    case 21:
                    case 22:
                    case 25:
                    case 26:
                    case 27:
                    case 28:
                    case 29:
                    case 30:
                    case 31:
                    case 37:
                    case 38:
                    case 40:
                    case 42:
                    case 43:
                    case 46:
                    case 48:
                    case 50:
                    case 52:
                    case 53:
                      break d;
                  }
                }
                J[e >> 2] = J[e >> 2] | 4;
                break b;
              }
              a = (ka - 16) | 0;
              ka = a;
              J[(a + 12) >> 2] = c;
              c = (h + 12) | 0;
              d = (a + 12) | 0;
              b = 6;
              o: {
                p: {
                  if (Ma(c, d)) {
                    break p;
                  }
                  b = 4;
                  if (
                    (((l = i),
                    (m = _b(c)),
                    (n = 0),
                    (k = J[(J[i >> 2] + 36) >> 2]),
                    oa[k](l | 0, m | 0, n | 0) | 0) |
                      0) !=
                    37
                  ) {
                    break p;
                  }
                  if (!Ma(sc(c), d)) {
                    break o;
                  }
                  b = 2;
                }
                J[e >> 2] = b | J[e >> 2];
              }
              ka = (a + 16) | 0;
            }
            a = J[(h + 12) >> 2];
          }
          ka = (h + 16) | 0;
          return a | 0;
        }
        function bi(a, b, c, d, e, f) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          f = f | 0;
          var g = 0,
            h = 0,
            i = 0,
            j = 0,
            k = 0,
            l = 0,
            m = 0,
            n = 0,
            o = 0,
            p = 0,
            q = 0,
            r = 0,
            s = 0,
            t = 0,
            u = 0,
            v = 0,
            w = 0,
            x = 0,
            A = 0,
            B = 0,
            C = 0,
            D = 0,
            E = 0,
            F = 0,
            G = 0;
          g = (ka - 496) | 0;
          ka = g;
          a = (g + 492) | 0;
          Ha(a, d);
          o = ib(a);
          k = H[(f + 11) | 0];
          a = (k | 0) < 0;
          if (a ? J[(f + 4) >> 2] : k) {
            j =
              J[(a ? J[f >> 2] : f) >> 2] ==
              (oa[J[(J[o >> 2] + 44) >> 2]](o, 45) | 0);
          }
          J[(g + 472) >> 2] = 0;
          J[(g + 464) >> 2] = 0;
          J[(g + 468) >> 2] = 0;
          J[(g + 456) >> 2] = 0;
          J[(g + 448) >> 2] = 0;
          J[(g + 452) >> 2] = 0;
          J[(g + 440) >> 2] = 0;
          J[(g + 432) >> 2] = 0;
          J[(g + 436) >> 2] = 0;
          a = (g + 492) | 0;
          k = (g + 488) | 0;
          l = (g + 484) | 0;
          n = (g + 480) | 0;
          p = (g + 464) | 0;
          r = (g + 448) | 0;
          s = (g + 432) | 0;
          m = (g + 428) | 0;
          h = (ka - 16) | 0;
          ka = h;
          a: {
            if (c) {
              a = gb(a, 20920);
              break a;
            }
            a = gb(a, 20912);
          }
          b: {
            if (j) {
              c = (h + 4) | 0;
              oa[J[(J[a >> 2] + 44) >> 2]](c, a);
              i = J[(h + 4) >> 2];
              H[k | 0] = i;
              H[(k + 1) | 0] = i >>> 8;
              H[(k + 2) | 0] = i >>> 16;
              H[(k + 3) | 0] = i >>> 24;
              oa[J[(J[a >> 2] + 32) >> 2]](c, a);
              break b;
            }
            c = (h + 4) | 0;
            oa[J[(J[a >> 2] + 40) >> 2]](c, a);
            i = J[(h + 4) >> 2];
            H[k | 0] = i;
            H[(k + 1) | 0] = i >>> 8;
            H[(k + 2) | 0] = i >>> 16;
            H[(k + 3) | 0] = i >>> 24;
            oa[J[(J[a >> 2] + 28) >> 2]](c, a);
          }
          se(s, c);
          ya(c);
          ((F = l), (G = oa[J[(J[a >> 2] + 12) >> 2]](a) | 0), (J[F >> 2] = G));
          ((F = n), (G = oa[J[(J[a >> 2] + 16) >> 2]](a) | 0), (J[F >> 2] = G));
          c = (h + 4) | 0;
          oa[J[(J[a >> 2] + 20) >> 2]](c, a);
          Ac(p, c);
          ya(c);
          oa[J[(J[a >> 2] + 24) >> 2]](c, a);
          se(r, c);
          ya(c);
          ((F = m), (G = oa[J[(J[a >> 2] + 36) >> 2]](a) | 0), (J[F >> 2] = G));
          ka = (h + 16) | 0;
          c: {
            k = J[(g + 428) >> 2];
            h = J[(f + 4) >> 2];
            a = H[(f + 11) | 0];
            c = (a | 0) < 0 ? h : a;
            d: {
              if ((k | 0) < (c | 0)) {
                i = (((c - k) << 1) + k) | 0;
                c = H[(g + 443) | 0];
                i = (i + ((c | 0) < 0 ? J[(g + 436) >> 2] : c)) | 0;
                c = H[(g + 459) | 0];
                c = (((i + ((c | 0) < 0 ? J[(g + 452) >> 2] : c)) | 0) + 1) | 0;
                break d;
              }
              c = H[(g + 443) | 0];
              i = (((c | 0) < 0 ? J[(g + 436) >> 2] : c) + k) | 0;
              c = H[(g + 459) | 0];
              c = (((i + ((c | 0) < 0 ? J[(g + 452) >> 2] : c)) | 0) + 2) | 0;
            }
            e: {
              if (c >>> 0 < 101) {
                c = 0;
                i = (g + 16) | 0;
                break e;
              }
              c = Wa(c << 2);
              if (!c) {
                break c;
              }
              a = K[(f + 11) | 0];
              h = J[(f + 4) >> 2];
              i = c;
            }
            t = i;
            u = (g + 12) | 0;
            v = J[(d + 4) >> 2];
            p = J[f >> 2];
            i = f;
            f = (a << 24) >> 24 < 0;
            i = f ? p : i;
            p = i;
            w = (((f ? h : a) << 2) + i) | 0;
            x = (g + 488) | 0;
            A = J[(g + 484) >> 2];
            B = J[(g + 480) >> 2];
            l = (g + 464) | 0;
            r = (g + 448) | 0;
            n = (g + 432) | 0;
            s = 0;
            h = (g + 8) | 0;
            J[h >> 2] = t;
            C = j ? 4 : 0;
            D = v & 512;
            while (1) {
              if ((s | 0) == 4) {
                f = H[(n + 11) | 0];
                a = (f | 0) < 0;
                j = a ? J[(n + 4) >> 2] : f;
                if (j >>> 0 > 1) {
                  f = J[h >> 2];
                  j = ((j << 2) - 4) | 0;
                  if (j) {
                    z(f, ((a ? J[n >> 2] : n) + 4) | 0, j);
                  }
                  J[h >> 2] = f + j;
                }
                a = v & 176;
                if ((a | 0) != 16) {
                  J[u >> 2] = (a | 0) == 32 ? J[h >> 2] : t;
                }
              } else {
                f: {
                  g: {
                    switch (K[(s + x) | 0]) {
                      case 0:
                        J[u >> 2] = J[h >> 2];
                        break f;
                      case 1:
                        J[u >> 2] = J[h >> 2];
                        a = oa[J[(J[o >> 2] + 44) >> 2]](o, 32) | 0;
                        f = J[h >> 2];
                        J[h >> 2] = f + 4;
                        J[f >> 2] = a;
                        break f;
                      case 3:
                        f = H[(n + 11) | 0];
                        a = (f | 0) < 0;
                        if (!(a ? J[(n + 4) >> 2] : f)) {
                          break f;
                        }
                        a = J[(a ? J[n >> 2] : n) >> 2];
                        f = J[h >> 2];
                        J[h >> 2] = f + 4;
                        J[f >> 2] = a;
                        break f;
                      case 2:
                        if (!D) {
                          break f;
                        }
                        f = H[(r + 11) | 0];
                        a = (f | 0) < 0;
                        j = a ? J[(r + 4) >> 2] : f;
                        if (!j) {
                          break f;
                        }
                        f = J[h >> 2];
                        j = j << 2;
                        if (j) {
                          z(f, a ? J[r >> 2] : r, j);
                        }
                        J[h >> 2] = f + j;
                        break f;
                      case 4:
                        break g;
                      default:
                        break f;
                    }
                  }
                  E = J[h >> 2];
                  p = (p + C) | 0;
                  i = p;
                  while (1) {
                    h: {
                      if (i >>> 0 >= w >>> 0) {
                        break h;
                      }
                      if (
                        !(oa[J[(J[o >> 2] + 12) >> 2]](o, 64, J[i >> 2]) | 0)
                      ) {
                        break h;
                      }
                      i = (i + 4) | 0;
                      continue;
                    }
                    break;
                  }
                  if ((k | 0) > 0) {
                    a = J[h >> 2];
                    f = k;
                    while (1) {
                      if (!(!f | (i >>> 0 <= p >>> 0))) {
                        f = (f - 1) | 0;
                        i = (i - 4) | 0;
                        m = J[i >> 2];
                        j = (a + 4) | 0;
                        J[h >> 2] = j;
                        J[a >> 2] = m;
                        a = j;
                        continue;
                      }
                      break;
                    }
                    if (f) {
                      m = oa[J[(J[o >> 2] + 44) >> 2]](o, 48) | 0;
                    } else {
                      m = 0;
                    }
                    a = J[h >> 2];
                    while (1) {
                      if ((f | 0) > 0) {
                        j = (a + 4) | 0;
                        J[h >> 2] = j;
                        J[a >> 2] = m;
                        f = (f - 1) | 0;
                        a = j;
                        continue;
                      }
                      break;
                    }
                    a = J[h >> 2];
                    J[h >> 2] = a + 4;
                    J[a >> 2] = A;
                  }
                  i: {
                    if ((i | 0) == (p | 0)) {
                      a = oa[J[(J[o >> 2] + 44) >> 2]](o, 48) | 0;
                      f = J[h >> 2];
                      J[h >> 2] = f + 4;
                      J[f >> 2] = a;
                      break i;
                    }
                    a = H[(l + 11) | 0];
                    f = (a | 0) < 0;
                    j = (f ? J[(l + 4) >> 2] : a)
                      ? H[(f ? J[l >> 2] : l) | 0]
                      : -1;
                    f = 0;
                    m = 0;
                    while (1) {
                      if ((i | 0) == (p | 0)) {
                        break i;
                      }
                      j: {
                        if ((f | 0) != (j | 0)) {
                          a = f;
                          break j;
                        }
                        a = J[h >> 2];
                        J[h >> 2] = a + 4;
                        J[a >> 2] = B;
                        a = 0;
                        m = (m + 1) | 0;
                        q = H[(l + 11) | 0];
                        if (
                          m >>> 0 >=
                          ((q | 0) < 0 ? J[(l + 4) >> 2] : q) >>> 0
                        ) {
                          j = f;
                          break j;
                        }
                        j = -1;
                        f = J[l >> 2];
                        q = (q | 0) < 0;
                        if (K[((q ? f : l) + m) | 0] == 127) {
                          break j;
                        }
                        j = H[((q ? f : l) + m) | 0];
                      }
                      i = (i - 4) | 0;
                      f = J[i >> 2];
                      q = J[h >> 2];
                      J[h >> 2] = q + 4;
                      J[q >> 2] = f;
                      f = (a + 1) | 0;
                      continue;
                    }
                  }
                  Uc(E, J[h >> 2]);
                }
                s = (s + 1) | 0;
                continue;
              }
              break;
            }
            a = Vc(b, t, J[(g + 12) >> 2], J[(g + 8) >> 2], d, e);
            Aa(c);
            ya(n);
            ya(r);
            ya(l);
            Ka(J[(g + 492) >> 2]);
            ka = (g + 496) | 0;
            return a | 0;
          }
          Oa();
          y();
        }
        function di(a, b, c, d, e, f) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          f = f | 0;
          var g = 0,
            h = 0,
            i = 0,
            j = 0,
            k = 0,
            l = 0,
            m = 0,
            n = 0,
            o = 0,
            p = 0,
            q = 0,
            r = 0,
            s = 0,
            t = 0,
            u = 0,
            v = 0,
            w = 0,
            x = 0,
            A = 0,
            B = 0,
            C = 0,
            D = 0,
            E = 0,
            F = 0,
            G = 0;
          h = (ka - 176) | 0;
          ka = h;
          a = (h + 172) | 0;
          Ha(a, d);
          p = eb(a);
          j = H[(f + 11) | 0];
          a = (j | 0) < 0;
          if (a ? J[(f + 4) >> 2] : j) {
            g =
              K[(a ? J[f >> 2] : f) | 0] ==
              (oa[J[(J[p >> 2] + 28) >> 2]](p, 45) & 255);
          }
          J[(h + 160) >> 2] = 0;
          J[(h + 152) >> 2] = 0;
          J[(h + 156) >> 2] = 0;
          J[(h + 144) >> 2] = 0;
          J[(h + 136) >> 2] = 0;
          J[(h + 140) >> 2] = 0;
          J[(h + 128) >> 2] = 0;
          J[(h + 120) >> 2] = 0;
          J[(h + 124) >> 2] = 0;
          a = (h + 172) | 0;
          j = (h + 168) | 0;
          l = (h + 167) | 0;
          n = (h + 166) | 0;
          o = (h + 152) | 0;
          k = (h + 136) | 0;
          r = (h + 120) | 0;
          s = (h + 116) | 0;
          m = (ka - 16) | 0;
          ka = m;
          a: {
            if (c) {
              a = gb(a, 20904);
              break a;
            }
            a = gb(a, 20896);
          }
          b: {
            if (g) {
              c = (m + 4) | 0;
              oa[J[(J[a >> 2] + 44) >> 2]](c, a);
              i = J[(m + 4) >> 2];
              H[j | 0] = i;
              H[(j + 1) | 0] = i >>> 8;
              H[(j + 2) | 0] = i >>> 16;
              H[(j + 3) | 0] = i >>> 24;
              oa[J[(J[a >> 2] + 32) >> 2]](c, a);
              break b;
            }
            c = (m + 4) | 0;
            oa[J[(J[a >> 2] + 40) >> 2]](c, a);
            i = J[(m + 4) >> 2];
            H[j | 0] = i;
            H[(j + 1) | 0] = i >>> 8;
            H[(j + 2) | 0] = i >>> 16;
            H[(j + 3) | 0] = i >>> 24;
            oa[J[(J[a >> 2] + 28) >> 2]](c, a);
          }
          Ac(r, c);
          ya(c);
          ((F = l), (G = oa[J[(J[a >> 2] + 12) >> 2]](a) | 0), (H[F | 0] = G));
          ((F = n), (G = oa[J[(J[a >> 2] + 16) >> 2]](a) | 0), (H[F | 0] = G));
          c = (m + 4) | 0;
          oa[J[(J[a >> 2] + 20) >> 2]](c, a);
          Ac(o, c);
          ya(c);
          oa[J[(J[a >> 2] + 24) >> 2]](c, a);
          Ac(k, c);
          ya(c);
          ((F = s), (G = oa[J[(J[a >> 2] + 36) >> 2]](a) | 0), (J[F >> 2] = G));
          ka = (m + 16) | 0;
          c: {
            a = J[(h + 116) >> 2];
            m = J[(f + 4) >> 2];
            j = H[(f + 11) | 0];
            c = (j | 0) < 0 ? m : j;
            d: {
              if ((a | 0) < (c | 0)) {
                k = (((c - a) << 1) + a) | 0;
                c = H[(h + 131) | 0];
                k = (k + ((c | 0) < 0 ? J[(h + 124) >> 2] : c)) | 0;
                c = H[(h + 147) | 0];
                c = (((k + ((c | 0) < 0 ? J[(h + 140) >> 2] : c)) | 0) + 1) | 0;
                break d;
              }
              c = H[(h + 131) | 0];
              k = (((c | 0) < 0 ? J[(h + 124) >> 2] : c) + a) | 0;
              c = H[(h + 147) | 0];
              c = (((k + ((c | 0) < 0 ? J[(h + 140) >> 2] : c)) | 0) + 2) | 0;
            }
            e: {
              if (c >>> 0 < 101) {
                c = 0;
                k = (h + 16) | 0;
                break e;
              }
              c = Wa(c);
              if (!c) {
                break c;
              }
              j = K[(f + 11) | 0];
              m = J[(f + 4) >> 2];
              k = c;
            }
            u = k;
            v = (h + 12) | 0;
            w = J[(d + 4) >> 2];
            i = J[f >> 2];
            k = f;
            f = (j << 24) >> 24 < 0;
            i = f ? i : k;
            k = i;
            x = ((f ? m : j) + i) | 0;
            m = g;
            A = (h + 168) | 0;
            B = H[(h + 167) | 0];
            C = H[(h + 166) | 0];
            n = (h + 152) | 0;
            r = (h + 136) | 0;
            o = (h + 120) | 0;
            f = a;
            s = 0;
            i = (h + 8) | 0;
            J[i >> 2] = u;
            D = w & 512;
            while (1) {
              if ((s | 0) == 4) {
                f = H[(o + 11) | 0];
                a = (f | 0) < 0;
                g = a ? J[(o + 4) >> 2] : f;
                if (g >>> 0 > 1) {
                  f = J[i >> 2];
                  g = (g - 1) | 0;
                  if (g) {
                    z(f, ((a ? J[o >> 2] : o) + 1) | 0, g);
                  }
                  J[i >> 2] = f + g;
                }
                a = w & 176;
                if ((a | 0) != 16) {
                  J[v >> 2] = (a | 0) == 32 ? J[i >> 2] : u;
                }
              } else {
                f: {
                  g: {
                    switch (K[(s + A) | 0]) {
                      case 0:
                        J[v >> 2] = J[i >> 2];
                        break f;
                      case 1:
                        J[v >> 2] = J[i >> 2];
                        a = oa[J[(J[p >> 2] + 28) >> 2]](p, 32) | 0;
                        g = J[i >> 2];
                        J[i >> 2] = g + 1;
                        H[g | 0] = a;
                        break f;
                      case 3:
                        g = H[(o + 11) | 0];
                        a = (g | 0) < 0;
                        if (!(a ? J[(o + 4) >> 2] : g)) {
                          break f;
                        }
                        a = K[(a ? J[o >> 2] : o) | 0];
                        g = J[i >> 2];
                        J[i >> 2] = g + 1;
                        H[g | 0] = a;
                        break f;
                      case 2:
                        if (!D) {
                          break f;
                        }
                        a = H[(r + 11) | 0];
                        g = (a | 0) < 0;
                        a = g ? J[(r + 4) >> 2] : a;
                        if (!a) {
                          break f;
                        }
                        j = J[i >> 2];
                        if (a) {
                          z(j, g ? J[r >> 2] : r, a);
                        }
                        J[i >> 2] = a + j;
                        break f;
                      case 4:
                        break g;
                      default:
                        break f;
                    }
                  }
                  a = J[(p + 8) >> 2];
                  E = J[i >> 2];
                  k = (m + k) | 0;
                  l = k;
                  while (1) {
                    h: {
                      if (l >>> 0 >= x >>> 0) {
                        break h;
                      }
                      g = H[l | 0];
                      if (((g | 0) < 0) | !(K[(a + (g << 2)) | 0] & 64)) {
                        break h;
                      }
                      l = (l + 1) | 0;
                      continue;
                    }
                    break;
                  }
                  a = f;
                  if ((a | 0) > 0) {
                    while (1) {
                      if (!(!a | (l >>> 0 <= k >>> 0))) {
                        a = (a - 1) | 0;
                        l = (l - 1) | 0;
                        g = K[l | 0];
                        j = J[i >> 2];
                        J[i >> 2] = j + 1;
                        H[j | 0] = g;
                        continue;
                      }
                      break;
                    }
                    if (a) {
                      j = oa[J[(J[p >> 2] + 28) >> 2]](p, 48) | 0;
                    } else {
                      j = 0;
                    }
                    while (1) {
                      g = J[i >> 2];
                      J[i >> 2] = g + 1;
                      if ((a | 0) > 0) {
                        H[g | 0] = j;
                        a = (a - 1) | 0;
                        continue;
                      }
                      break;
                    }
                    H[g | 0] = B;
                  }
                  i: {
                    if ((l | 0) == (k | 0)) {
                      a = oa[J[(J[p >> 2] + 28) >> 2]](p, 48) | 0;
                      g = J[i >> 2];
                      J[i >> 2] = g + 1;
                      H[g | 0] = a;
                      break i;
                    }
                    a = H[(n + 11) | 0];
                    g = (a | 0) < 0;
                    g = (g ? J[(n + 4) >> 2] : a)
                      ? H[(g ? J[n >> 2] : n) | 0]
                      : -1;
                    a = 0;
                    t = 0;
                    while (1) {
                      if ((l | 0) == (k | 0)) {
                        break i;
                      }
                      j: {
                        if ((a | 0) != (g | 0)) {
                          j = a;
                          break j;
                        }
                        g = J[i >> 2];
                        J[i >> 2] = g + 1;
                        H[g | 0] = C;
                        j = 0;
                        t = (t + 1) | 0;
                        q = H[(n + 11) | 0];
                        if (
                          t >>> 0 >=
                          ((q | 0) < 0 ? J[(n + 4) >> 2] : q) >>> 0
                        ) {
                          g = a;
                          break j;
                        }
                        g = -1;
                        a = J[n >> 2];
                        q = (q | 0) < 0;
                        if (K[((q ? a : n) + t) | 0] == 127) {
                          break j;
                        }
                        g = H[((q ? a : n) + t) | 0];
                      }
                      l = (l - 1) | 0;
                      a = K[l | 0];
                      q = J[i >> 2];
                      J[i >> 2] = q + 1;
                      H[q | 0] = a;
                      a = (j + 1) | 0;
                      continue;
                    }
                  }
                  nc(E, J[i >> 2]);
                }
                s = (s + 1) | 0;
                continue;
              }
              break;
            }
            a = jc(b, u, J[(h + 12) >> 2], J[(h + 8) >> 2], d, e);
            Aa(c);
            ya(o);
            ya(r);
            ya(n);
            Ka(J[(h + 172) >> 2]);
            ka = (h + 176) | 0;
            return a | 0;
          }
          Oa();
          y();
        }
        function Ya(a, b, c, d, e, f, g, h, i) {
          var j = 0,
            k = 0,
            l = 0,
            m = 0,
            n = 0,
            o = 0,
            p = 0,
            q = 0,
            r = 0,
            s = 0,
            t = 0;
          k = (ka - 112) | 0;
          ka = k;
          q = i & 2147483647;
          n = e & 2147483647;
          l = n;
          a: {
            b: {
              m = 2147418112;
              j = !(b | c);
              if (!(d | l ? (l - m) >>> 0 < 2147549184 : j)) {
                n = (q - m) | 0;
                if (
                  !h & ((n | 0) == -2147418112)
                    ? f | g
                    : (((n | 0) == -2147418112) & ((h | 0) != 0)) |
                      (n >>> 0 > 2147549184)
                ) {
                  break b;
                }
              }
              if (!(!d & ((l | 0) == 2147418112) ? j : l >>> 0 < 2147418112)) {
                h = d;
                i = e | 32768;
                f = b;
                g = c;
                break a;
              }
              if (
                !(!h & ((q | 0) == 2147418112)
                  ? !(f | g)
                  : q >>> 0 < 2147418112)
              ) {
                i = i | 32768;
                break a;
              }
              if (!(b | d | ((l ^ 2147418112) | c))) {
                j = d;
                d = !((b ^ f) | (d ^ h) | ((c ^ g) | (e ^ i ^ -2147483648)));
                h = d ? 0 : j;
                i = d ? 2147450880 : e;
                f = d ? 0 : b;
                g = d ? 0 : c;
                break a;
              }
              j = f | h;
              if (!(j | ((q ^ 2147418112) | g))) {
                break a;
              }
              if (!(b | d | (c | l))) {
                if (g | q | j) {
                  break a;
                }
                f = b & f;
                g = c & g;
                h = d & h;
                i = e & i;
                break a;
              }
              if (f | h | (g | q)) {
                break b;
              }
              f = b;
              g = c;
              h = d;
              i = e;
              break a;
            }
            j = (l | 0) == (q | 0);
            s =
              j & ((d | 0) == (h | 0))
                ? (((c | 0) == (g | 0)) & (b >>> 0 < f >>> 0)) |
                  (c >>> 0 < g >>> 0)
                : (j & (d >>> 0 < h >>> 0)) | (l >>> 0 < q >>> 0);
            l = s;
            n = l ? f : b;
            q = l ? g : c;
            p = l ? i : e;
            t = p;
            l = l ? h : d;
            p = p & 65535;
            j = s ? d : h;
            m = s ? e : i;
            d = m;
            r = (d >>> 16) & 32767;
            o = (t >>> 16) & 32767;
            if (!o) {
              o = !(l | p);
              m = S(o ? q : p);
              o =
                (((m | 0) == 32 ? (S(o ? n : l) + 32) | 0 : m) + (o ? 64 : 0)) |
                0;
              Ta((k + 96) | 0, n, q, l, p, (o - 15) | 0);
              l = J[(k + 104) >> 2];
              p = J[(k + 108) >> 2];
              q = J[(k + 100) >> 2];
              o = (16 - o) | 0;
              n = J[(k + 96) >> 2];
            }
            f = s ? b : f;
            g = s ? c : g;
            b = j;
            c = d & 65535;
            if (!r) {
              m = !(b | c);
              j = S(m ? g : c);
              m =
                (((j | 0) == 32 ? (S(m ? f : b) + 32) | 0 : j) + (m ? 64 : 0)) |
                0;
              Ta((k + 80) | 0, f, g, b, c, (m - 15) | 0);
              r = (16 - m) | 0;
              f = J[(k + 80) >> 2];
              g = J[(k + 84) >> 2];
              b = J[(k + 88) >> 2];
              c = J[(k + 92) >> 2];
            }
            m = (c << 3) | (b >>> 29);
            b = (b << 3) | (g >>> 29);
            c = m | 524288;
            j = (p << 3) | (l >>> 29);
            l = (l << 3) | (q >>> 29);
            h = j;
            e = e ^ i;
            j = (g << 3) | (f >>> 29);
            d = f << 3;
            c: {
              if ((o | 0) == (r | 0)) {
                break c;
              }
              f = (o - r) | 0;
              if (f >>> 0 > 127) {
                b = 0;
                c = 0;
                j = 0;
                d = 1;
                break c;
              }
              Ta((k - -64) | 0, d, j, b, c, (128 - f) | 0);
              Gb((k + 48) | 0, d, j, b, c, f);
              b = J[(k + 56) >> 2];
              c = J[(k + 60) >> 2];
              j = J[(k + 52) >> 2];
              d =
                J[(k + 48) >> 2] |
                ((J[(k + 64) >> 2] |
                  J[(k + 72) >> 2] |
                  (J[(k + 68) >> 2] | J[(k + 76) >> 2])) !=
                  0);
            }
            m = d;
            p = j;
            r = h | 524288;
            j = (q << 3) | (n >>> 29);
            n = n << 3;
            d: {
              if ((e | 0) < 0) {
                f = 0;
                g = 0;
                h = 0;
                i = 0;
                if (!((m ^ n) | (b ^ l) | ((j ^ p) | (c ^ r)))) {
                  break a;
                }
                d = (n - m) | 0;
                e = (j - (((m >>> 0 > n >>> 0) + p) | 0)) | 0;
                g = (l - b) | 0;
                f =
                  (((j | 0) == (p | 0)) & (m >>> 0 > n >>> 0)) |
                  (j >>> 0 < p >>> 0);
                h = (g - f) | 0;
                f =
                  (((r - (((b >>> 0 > l >>> 0) + c) | 0)) | 0) -
                    (f >>> 0 > g >>> 0)) |
                  0;
                i = f;
                if (f >>> 0 > 524287) {
                  break d;
                }
                c = !(f | h);
                b = S(c ? e : f);
                b =
                  ((((b | 0) == 32 ? (S(c ? d : h) + 32) | 0 : b) |
                    (c ? 64 : 0)) -
                    12) |
                  0;
                Ta((k + 32) | 0, d, e, h, f, b);
                o = (o - b) | 0;
                h = J[(k + 40) >> 2];
                i = J[(k + 44) >> 2];
                d = J[(k + 32) >> 2];
                e = J[(k + 36) >> 2];
                break d;
              }
              j = (j + p) | 0;
              d = (m + n) | 0;
              e = d >>> 0 < n >>> 0 ? (j + 1) | 0 : j;
              f =
                (((p | 0) == (e | 0)) & (d >>> 0 < m >>> 0)) |
                (e >>> 0 < p >>> 0);
              c = (c + r) | 0;
              g = (b + l) | 0;
              b = g >>> 0 < l >>> 0 ? (c + 1) | 0 : c;
              h = (f + g) | 0;
              i = h >>> 0 < g >>> 0 ? (b + 1) | 0 : b;
              if (!(i & 1048576)) {
                break d;
              }
              d = (m & 1) | (((e & 1) << 31) | (d >>> 1));
              e = (h << 31) | (e >>> 1);
              o = (o + 1) | 0;
              h = ((i & 1) << 31) | (h >>> 1);
              i = (i >>> 1) | 0;
            }
            c = 0;
            b = t & -2147483648;
            g = b;
            if ((o | 0) >= 32767) {
              h = c;
              i = b | 2147418112;
              f = 0;
              g = 0;
              break a;
            }
            r = 0;
            e: {
              if ((o | 0) > 0) {
                r = o;
                break e;
              }
              Ta((k + 16) | 0, d, e, h, i, (o + 127) | 0);
              Gb(k, d, e, h, i, (1 - o) | 0);
              d =
                J[k >> 2] |
                ((J[(k + 16) >> 2] |
                  J[(k + 24) >> 2] |
                  (J[(k + 20) >> 2] | J[(k + 28) >> 2])) !=
                  0);
              e = J[(k + 4) >> 2];
              h = J[(k + 8) >> 2];
              i = J[(k + 12) >> 2];
            }
            j = (e >>> 3) | 0;
            e = ((e & 7) << 29) | (d >>> 3);
            j = j | (h << 29);
            c = c | (((i & 7) << 29) | (h >>> 3));
            b = g | (((i >>> 3) & 65535) | (r << 16));
            f: {
              g: {
                n = d & 7;
                if ((n | 0) != 4) {
                  d = j;
                  f = n >>> 0 > 4;
                  g = f;
                  f = (e + f) | 0;
                  g = g >>> 0 > f >>> 0 ? (d + 1) | 0 : d;
                  d =
                    (((d | 0) == (g | 0)) & (e >>> 0 > f >>> 0)) |
                    (d >>> 0 > g >>> 0);
                  h = (c + d) | 0;
                  i = d >>> 0 > h >>> 0 ? (b + 1) | 0 : b;
                  break g;
                }
                d = e & 1;
                f = (d + e) | 0;
                g = d >>> 0 > f >>> 0 ? (j + 1) | 0 : j;
                d =
                  (((g | 0) == (j | 0)) & (e >>> 0 > f >>> 0)) |
                  (g >>> 0 < j >>> 0);
                h = (c + d) | 0;
                i = h >>> 0 < d >>> 0 ? (b + 1) | 0 : b;
                break f;
              }
              if (!n) {
                break a;
              }
            }
          }
          J[a >> 2] = f;
          J[(a + 4) >> 2] = g;
          J[(a + 8) >> 2] = h;
          J[(a + 12) >> 2] = i;
          ka = (k + 112) | 0;
        }
        function Aa(a) {
          a = a | 0;
          var b = 0,
            c = 0,
            d = 0,
            e = 0,
            f = 0,
            g = 0,
            h = 0,
            i = 0,
            j = 0,
            k = 0;
          a: {
            if (!a) {
              break a;
            }
            d = (a - 8) | 0;
            b = J[(a - 4) >> 2];
            a = b & -8;
            f = (d + a) | 0;
            b: {
              if (b & 1) {
                break b;
              }
              if (!(b & 2)) {
                break a;
              }
              b = J[d >> 2];
              d = (d - b) | 0;
              if (d >>> 0 < M[4163]) {
                break a;
              }
              a = (a + b) | 0;
              c: {
                d: {
                  e: {
                    if (J[4164] != (d | 0)) {
                      c = J[(d + 12) >> 2];
                      if (b >>> 0 <= 255) {
                        e = J[(d + 8) >> 2];
                        if ((e | 0) != (c | 0)) {
                          break e;
                        }
                        ((j = 16636),
                          (k = J[4159] & fk(-2, (b >>> 3) | 0)),
                          (J[j >> 2] = k));
                        break b;
                      }
                      h = J[(d + 24) >> 2];
                      if ((c | 0) != (d | 0)) {
                        b = J[(d + 8) >> 2];
                        J[(b + 12) >> 2] = c;
                        J[(c + 8) >> 2] = b;
                        break c;
                      }
                      e = J[(d + 20) >> 2];
                      if (e) {
                        b = (d + 20) | 0;
                      } else {
                        e = J[(d + 16) >> 2];
                        if (!e) {
                          break d;
                        }
                        b = (d + 16) | 0;
                      }
                      while (1) {
                        g = b;
                        c = e;
                        b = (c + 20) | 0;
                        e = J[(c + 20) >> 2];
                        if (e) {
                          continue;
                        }
                        b = (c + 16) | 0;
                        e = J[(c + 16) >> 2];
                        if (e) {
                          continue;
                        }
                        break;
                      }
                      J[g >> 2] = 0;
                      break c;
                    }
                    b = J[(f + 4) >> 2];
                    if ((b & 3) != 3) {
                      break b;
                    }
                    J[4161] = a;
                    J[(f + 4) >> 2] = b & -2;
                    J[(d + 4) >> 2] = a | 1;
                    J[f >> 2] = a;
                    return;
                  }
                  J[(e + 12) >> 2] = c;
                  J[(c + 8) >> 2] = e;
                  break b;
                }
                c = 0;
              }
              if (!h) {
                break b;
              }
              b = J[(d + 28) >> 2];
              e = b << 2;
              f: {
                if (J[(e + 16940) >> 2] == (d | 0)) {
                  J[(e + 16940) >> 2] = c;
                  if (c) {
                    break f;
                  }
                  ((j = 16640), (k = J[4160] & fk(-2, b)), (J[j >> 2] = k));
                  break b;
                }
                g: {
                  if (J[(h + 16) >> 2] == (d | 0)) {
                    J[(h + 16) >> 2] = c;
                    break g;
                  }
                  J[(h + 20) >> 2] = c;
                }
                if (!c) {
                  break b;
                }
              }
              J[(c + 24) >> 2] = h;
              b = J[(d + 16) >> 2];
              if (b) {
                J[(c + 16) >> 2] = b;
                J[(b + 24) >> 2] = c;
              }
              b = J[(d + 20) >> 2];
              if (!b) {
                break b;
              }
              J[(c + 20) >> 2] = b;
              J[(b + 24) >> 2] = c;
            }
            if (d >>> 0 >= f >>> 0) {
              break a;
            }
            b = J[(f + 4) >> 2];
            if (!(b & 1)) {
              break a;
            }
            h: {
              i: {
                j: {
                  k: {
                    if (!(b & 2)) {
                      if (J[4165] == (f | 0)) {
                        J[4165] = d;
                        a = (J[4162] + a) | 0;
                        J[4162] = a;
                        J[(d + 4) >> 2] = a | 1;
                        if (J[4164] != (d | 0)) {
                          break a;
                        }
                        J[4161] = 0;
                        J[4164] = 0;
                        return;
                      }
                      i = J[4164];
                      if ((i | 0) == (f | 0)) {
                        J[4164] = d;
                        a = (J[4161] + a) | 0;
                        J[4161] = a;
                        J[(d + 4) >> 2] = a | 1;
                        J[(a + d) >> 2] = a;
                        return;
                      }
                      a = ((b & -8) + a) | 0;
                      c = J[(f + 12) >> 2];
                      if (b >>> 0 <= 255) {
                        e = J[(f + 8) >> 2];
                        if ((e | 0) == (c | 0)) {
                          ((j = 16636),
                            (k = J[4159] & fk(-2, (b >>> 3) | 0)),
                            (J[j >> 2] = k));
                          break i;
                        }
                        J[(e + 12) >> 2] = c;
                        J[(c + 8) >> 2] = e;
                        break i;
                      }
                      h = J[(f + 24) >> 2];
                      if ((c | 0) != (f | 0)) {
                        b = J[(f + 8) >> 2];
                        J[(b + 12) >> 2] = c;
                        J[(c + 8) >> 2] = b;
                        break j;
                      }
                      e = J[(f + 20) >> 2];
                      if (e) {
                        b = (f + 20) | 0;
                      } else {
                        e = J[(f + 16) >> 2];
                        if (!e) {
                          break k;
                        }
                        b = (f + 16) | 0;
                      }
                      while (1) {
                        g = b;
                        c = e;
                        b = (c + 20) | 0;
                        e = J[(c + 20) >> 2];
                        if (e) {
                          continue;
                        }
                        b = (c + 16) | 0;
                        e = J[(c + 16) >> 2];
                        if (e) {
                          continue;
                        }
                        break;
                      }
                      J[g >> 2] = 0;
                      break j;
                    }
                    J[(f + 4) >> 2] = b & -2;
                    J[(d + 4) >> 2] = a | 1;
                    J[(a + d) >> 2] = a;
                    break h;
                  }
                  c = 0;
                }
                if (!h) {
                  break i;
                }
                b = J[(f + 28) >> 2];
                e = b << 2;
                l: {
                  if (J[(e + 16940) >> 2] == (f | 0)) {
                    J[(e + 16940) >> 2] = c;
                    if (c) {
                      break l;
                    }
                    ((j = 16640), (k = J[4160] & fk(-2, b)), (J[j >> 2] = k));
                    break i;
                  }
                  m: {
                    if (J[(h + 16) >> 2] == (f | 0)) {
                      J[(h + 16) >> 2] = c;
                      break m;
                    }
                    J[(h + 20) >> 2] = c;
                  }
                  if (!c) {
                    break i;
                  }
                }
                J[(c + 24) >> 2] = h;
                b = J[(f + 16) >> 2];
                if (b) {
                  J[(c + 16) >> 2] = b;
                  J[(b + 24) >> 2] = c;
                }
                b = J[(f + 20) >> 2];
                if (!b) {
                  break i;
                }
                J[(c + 20) >> 2] = b;
                J[(b + 24) >> 2] = c;
              }
              J[(d + 4) >> 2] = a | 1;
              J[(a + d) >> 2] = a;
              if ((d | 0) != (i | 0)) {
                break h;
              }
              J[4161] = a;
              return;
            }
            if (a >>> 0 <= 255) {
              b = ((a & 248) + 16676) | 0;
              e = J[4159];
              a = 1 << (a >>> 3);
              n: {
                if (!(e & a)) {
                  J[4159] = a | e;
                  a = b;
                  break n;
                }
                a = J[(b + 8) >> 2];
              }
              J[(b + 8) >> 2] = d;
              J[(a + 12) >> 2] = d;
              J[(d + 12) >> 2] = b;
              J[(d + 8) >> 2] = a;
              return;
            }
            c = 31;
            if (a >>> 0 <= 16777215) {
              b = S((a >>> 8) | 0);
              c = (((a >>> (38 - b)) & 1) | (b << 1)) ^ 62;
            }
            J[(d + 28) >> 2] = c;
            J[(d + 16) >> 2] = 0;
            J[(d + 20) >> 2] = 0;
            b = ((c << 2) + 16940) | 0;
            o: {
              p: {
                e = J[4160];
                g = 1 << c;
                q: {
                  if (!(e & g)) {
                    J[4160] = e | g;
                    J[b >> 2] = d;
                    c = 24;
                    break q;
                  }
                  c = a << ((c | 0) != 31 ? (25 - ((c >>> 1) | 0)) | 0 : 0);
                  b = J[b >> 2];
                  while (1) {
                    e = b;
                    if ((J[(b + 4) >> 2] & -8) == (a | 0)) {
                      break p;
                    }
                    b = (c >>> 29) | 0;
                    c = c << 1;
                    g = ((b & 4) + e) | 0;
                    b = J[(g + 16) >> 2];
                    if (b) {
                      continue;
                    }
                    break;
                  }
                  J[(g + 16) >> 2] = d;
                  b = e;
                  c = 24;
                }
                e = d;
                g = d;
                a = 8;
                break o;
              }
              b = J[(e + 8) >> 2];
              J[(b + 12) >> 2] = d;
              J[(e + 8) >> 2] = d;
              c = 8;
              g = 0;
              a = 24;
            }
            J[(c + d) >> 2] = b;
            J[(d + 12) >> 2] = e;
            J[(a + d) >> 2] = g;
            a = (J[4167] - 1) | 0;
            J[4167] = a ? a : -1;
          }
        }
        function Wf(a, b) {
          var c = 0,
            d = 0,
            e = 0,
            f = 0,
            g = 0,
            h = 0,
            i = 0,
            j = 0,
            k = 0;
          f = (a + b) | 0;
          c = J[(a + 4) >> 2];
          a: {
            b: {
              if (c & 1) {
                break b;
              }
              if (!(c & 2)) {
                break a;
              }
              c = J[a >> 2];
              b = (c + b) | 0;
              c: {
                d: {
                  e: {
                    a = (a - c) | 0;
                    if ((a | 0) != J[4164]) {
                      d = J[(a + 12) >> 2];
                      if (c >>> 0 <= 255) {
                        e = J[(a + 8) >> 2];
                        if ((e | 0) != (d | 0)) {
                          break e;
                        }
                        ((j = 16636),
                          (k = J[4159] & fk(-2, (c >>> 3) | 0)),
                          (J[j >> 2] = k));
                        break b;
                      }
                      g = J[(a + 24) >> 2];
                      if ((a | 0) != (d | 0)) {
                        c = J[(a + 8) >> 2];
                        J[(c + 12) >> 2] = d;
                        J[(d + 8) >> 2] = c;
                        break c;
                      }
                      e = J[(a + 20) >> 2];
                      if (e) {
                        c = (a + 20) | 0;
                      } else {
                        e = J[(a + 16) >> 2];
                        if (!e) {
                          break d;
                        }
                        c = (a + 16) | 0;
                      }
                      while (1) {
                        h = c;
                        d = e;
                        c = (d + 20) | 0;
                        e = J[(d + 20) >> 2];
                        if (e) {
                          continue;
                        }
                        c = (d + 16) | 0;
                        e = J[(d + 16) >> 2];
                        if (e) {
                          continue;
                        }
                        break;
                      }
                      J[h >> 2] = 0;
                      break c;
                    }
                    c = J[(f + 4) >> 2];
                    if ((c & 3) != 3) {
                      break b;
                    }
                    J[4161] = b;
                    J[(f + 4) >> 2] = c & -2;
                    J[(a + 4) >> 2] = b | 1;
                    J[f >> 2] = b;
                    return;
                  }
                  J[(e + 12) >> 2] = d;
                  J[(d + 8) >> 2] = e;
                  break b;
                }
                d = 0;
              }
              if (!g) {
                break b;
              }
              c = J[(a + 28) >> 2];
              e = c << 2;
              f: {
                if (J[(e + 16940) >> 2] == (a | 0)) {
                  J[(e + 16940) >> 2] = d;
                  if (d) {
                    break f;
                  }
                  ((j = 16640), (k = J[4160] & fk(-2, c)), (J[j >> 2] = k));
                  break b;
                }
                g: {
                  if (J[(g + 16) >> 2] == (a | 0)) {
                    J[(g + 16) >> 2] = d;
                    break g;
                  }
                  J[(g + 20) >> 2] = d;
                }
                if (!d) {
                  break b;
                }
              }
              J[(d + 24) >> 2] = g;
              c = J[(a + 16) >> 2];
              if (c) {
                J[(d + 16) >> 2] = c;
                J[(c + 24) >> 2] = d;
              }
              c = J[(a + 20) >> 2];
              if (!c) {
                break b;
              }
              J[(d + 20) >> 2] = c;
              J[(c + 24) >> 2] = d;
            }
            h: {
              i: {
                j: {
                  k: {
                    c = J[(f + 4) >> 2];
                    if (!(c & 2)) {
                      if (J[4165] == (f | 0)) {
                        J[4165] = a;
                        b = (J[4162] + b) | 0;
                        J[4162] = b;
                        J[(a + 4) >> 2] = b | 1;
                        if (J[4164] != (a | 0)) {
                          break a;
                        }
                        J[4161] = 0;
                        J[4164] = 0;
                        return;
                      }
                      i = J[4164];
                      if ((i | 0) == (f | 0)) {
                        J[4164] = a;
                        b = (J[4161] + b) | 0;
                        J[4161] = b;
                        J[(a + 4) >> 2] = b | 1;
                        J[(a + b) >> 2] = b;
                        return;
                      }
                      b = ((c & -8) + b) | 0;
                      d = J[(f + 12) >> 2];
                      if (c >>> 0 <= 255) {
                        e = J[(f + 8) >> 2];
                        if ((e | 0) == (d | 0)) {
                          ((j = 16636),
                            (k = J[4159] & fk(-2, (c >>> 3) | 0)),
                            (J[j >> 2] = k));
                          break i;
                        }
                        J[(e + 12) >> 2] = d;
                        J[(d + 8) >> 2] = e;
                        break i;
                      }
                      g = J[(f + 24) >> 2];
                      if ((d | 0) != (f | 0)) {
                        c = J[(f + 8) >> 2];
                        J[(c + 12) >> 2] = d;
                        J[(d + 8) >> 2] = c;
                        break j;
                      }
                      e = J[(f + 20) >> 2];
                      if (e) {
                        c = (f + 20) | 0;
                      } else {
                        e = J[(f + 16) >> 2];
                        if (!e) {
                          break k;
                        }
                        c = (f + 16) | 0;
                      }
                      while (1) {
                        h = c;
                        d = e;
                        c = (d + 20) | 0;
                        e = J[(d + 20) >> 2];
                        if (e) {
                          continue;
                        }
                        c = (d + 16) | 0;
                        e = J[(d + 16) >> 2];
                        if (e) {
                          continue;
                        }
                        break;
                      }
                      J[h >> 2] = 0;
                      break j;
                    }
                    J[(f + 4) >> 2] = c & -2;
                    J[(a + 4) >> 2] = b | 1;
                    J[(a + b) >> 2] = b;
                    break h;
                  }
                  d = 0;
                }
                if (!g) {
                  break i;
                }
                c = J[(f + 28) >> 2];
                e = c << 2;
                l: {
                  if (J[(e + 16940) >> 2] == (f | 0)) {
                    J[(e + 16940) >> 2] = d;
                    if (d) {
                      break l;
                    }
                    ((j = 16640), (k = J[4160] & fk(-2, c)), (J[j >> 2] = k));
                    break i;
                  }
                  m: {
                    if (J[(g + 16) >> 2] == (f | 0)) {
                      J[(g + 16) >> 2] = d;
                      break m;
                    }
                    J[(g + 20) >> 2] = d;
                  }
                  if (!d) {
                    break i;
                  }
                }
                J[(d + 24) >> 2] = g;
                c = J[(f + 16) >> 2];
                if (c) {
                  J[(d + 16) >> 2] = c;
                  J[(c + 24) >> 2] = d;
                }
                c = J[(f + 20) >> 2];
                if (!c) {
                  break i;
                }
                J[(d + 20) >> 2] = c;
                J[(c + 24) >> 2] = d;
              }
              J[(a + 4) >> 2] = b | 1;
              J[(a + b) >> 2] = b;
              if ((a | 0) != (i | 0)) {
                break h;
              }
              J[4161] = b;
              return;
            }
            if (b >>> 0 <= 255) {
              c = ((b & 248) + 16676) | 0;
              d = J[4159];
              b = 1 << (b >>> 3);
              n: {
                if (!(d & b)) {
                  J[4159] = b | d;
                  b = c;
                  break n;
                }
                b = J[(c + 8) >> 2];
              }
              J[(c + 8) >> 2] = a;
              J[(b + 12) >> 2] = a;
              J[(a + 12) >> 2] = c;
              J[(a + 8) >> 2] = b;
              return;
            }
            d = 31;
            if (b >>> 0 <= 16777215) {
              c = S((b >>> 8) | 0);
              d = (((b >>> (38 - c)) & 1) | (c << 1)) ^ 62;
            }
            J[(a + 28) >> 2] = d;
            J[(a + 16) >> 2] = 0;
            J[(a + 20) >> 2] = 0;
            c = ((d << 2) + 16940) | 0;
            o: {
              e = J[4160];
              h = 1 << d;
              p: {
                if (!(e & h)) {
                  J[4160] = e | h;
                  J[c >> 2] = a;
                  J[(a + 24) >> 2] = c;
                  break p;
                }
                d = b << ((d | 0) != 31 ? (25 - ((d >>> 1) | 0)) | 0 : 0);
                c = J[c >> 2];
                while (1) {
                  e = c;
                  if ((J[(c + 4) >> 2] & -8) == (b | 0)) {
                    break o;
                  }
                  c = (d >>> 29) | 0;
                  d = d << 1;
                  h = (e + (c & 4)) | 0;
                  c = J[(h + 16) >> 2];
                  if (c) {
                    continue;
                  }
                  break;
                }
                J[(h + 16) >> 2] = a;
                J[(a + 24) >> 2] = e;
              }
              J[(a + 12) >> 2] = a;
              J[(a + 8) >> 2] = a;
              return;
            }
            b = J[(e + 8) >> 2];
            J[(b + 12) >> 2] = a;
            J[(e + 8) >> 2] = a;
            J[(a + 24) >> 2] = 0;
            J[(a + 12) >> 2] = e;
            J[(a + 8) >> 2] = b;
          }
        }
        function yd(a, b, c, d) {
          var e = 0,
            f = 0,
            g = 0,
            h = 0,
            i = 0,
            j = 0,
            k = 0,
            l = 0,
            m = 0,
            n = 0,
            o = 0,
            p = 0,
            q = 0,
            r = 0,
            s = 0,
            t = 0,
            u = 0,
            v = 0,
            w = 0;
          i = (ka - 144) | 0;
          ka = i;
          a: {
            b: {
              c: {
                d: {
                  if ((c | 0) < (d | 0)) {
                    if (Gc(b)) {
                      break d;
                    }
                    f = J[(a + 36) >> 2];
                    h = f;
                    g = (f + 1) | 0;
                    f = (J[(a + 32) >> 2] + 1) | 0;
                    g = f ? h : g;
                    J[(a + 32) >> 2] = f;
                    J[(a + 36) >> 2] = g;
                    e: {
                      if (!Gc(b)) {
                        f = (J[(b + 12) >> 2] + 1032) | 0;
                        g = (f + 1) | 0;
                        h = f;
                        f = (J[(b + 8) >> 2] + 270549121) | 0;
                        k = f >>> 0 < 270549121 ? g : h;
                        h = f & -135274561;
                        f = J[(b + 8) >> 2];
                        g = J[(b + 12) >> 2];
                        j = Hc(f ^ J[b >> 2], g ^ J[(b + 4) >> 2], f, g);
                        g = h & j;
                        f = k & 65019;
                        l = na;
                        k = f & l;
                        f: {
                          if (g | k) {
                            h = g;
                            f = k;
                            k = 0;
                            if (((g - 1) & g) | (f & (f - !g))) {
                              break f;
                            }
                          }
                          p = ((((l & 1) << 31) | (j >>> 1)) ^ -1) & h;
                          k = ((l >>> 1) ^ -1) & f;
                        }
                        break e;
                      }
                      _(2061, 1542, 188, 1435);
                      y();
                    }
                    f = J[(b + 16) >> 2];
                    if (!(k | p)) {
                      e = (((f - 42) | 0) / 2) | 0;
                      break a;
                    }
                    if ((f | 0) > 39) {
                      break a;
                    }
                    e = (0 - (((40 - f) >>> 1) | 0)) | 0;
                    if ((e | 0) > (c | 0)) {
                      c = e;
                      if ((d | 0) <= (c | 0)) {
                        break a;
                      }
                    }
                    e = ((41 - f) >>> 1) | 0;
                    if ((e | 0) < (d | 0)) {
                      d = e;
                      if ((c | 0) >= (e | 0)) {
                        break a;
                      }
                    }
                    e = J[b >> 2];
                    f = (e + J[(b + 8) >> 2]) | 0;
                    l = f;
                    g = (J[(b + 12) >> 2] + J[(b + 4) >> 2]) | 0;
                    q = e >>> 0 > f >>> 0 ? (g + 1) | 0 : g;
                    e = Df(a, f, q);
                    if (!e) {
                      break c;
                    }
                    if (e >>> 0 >= 38) {
                      f = (e - 56) | 0;
                      if ((f | 0) <= (c | 0)) {
                        break c;
                      }
                      e = f;
                      if ((e | 0) < (d | 0)) {
                        break b;
                      }
                      break a;
                    }
                    e = (e - 19) | 0;
                    if ((e | 0) >= (d | 0)) {
                      break c;
                    }
                    d = e;
                    f = c;
                    if ((c | 0) >= (e | 0)) {
                      break a;
                    }
                    break b;
                  }
                  _(1869, 1562, 40, 1331);
                  y();
                }
                _(2045, 1562, 41, 1331);
                y();
              }
              f = c;
            }
            if (J[(b + 16) >> 2] <= J[(a + 24) >> 2]) {
              g = J[(a + 12) >> 2];
              c = 0;
              e = (ka - 16) | 0;
              ka = e;
              J[(e + 8) >> 2] = 0;
              J[(e + 12) >> 2] = 0;
              while (1) {
                if ((c | 0) == 7) {
                  g: {
                    J[e >> 2] = 0;
                    J[(e + 4) >> 2] = 0;
                    c = 7;
                    while (1) {
                      if (!c) {
                        break g;
                      }
                      c = (c - 1) | 0;
                      xd(b, e, c);
                      continue;
                    }
                  }
                } else {
                  xd(b, (e + 8) | 0, c);
                  c = (c + 1) | 0;
                  continue;
                }
                break;
              }
              ka = (e + 16) | 0;
              h = J[(e + 8) >> 2];
              n = h;
              j = J[e >> 2];
              c = J[(e + 4) >> 2];
              e = J[(e + 12) >> 2];
              h =
                (((c | 0) == (e | 0)) & (h >>> 0 < j >>> 0)) |
                (c >>> 0 > e >>> 0);
              c =
                ((u = g),
                (v = bk(h ? n : j, h ? e : c, 3)),
                (w = na),
                (t = J[(J[g >> 2] + 20) >> 2]),
                oa[t](u | 0, v | 0, w | 0) | 0);
            } else {
              c = 0;
            }
            if (c) {
              e = (c - 19) | 0;
              break a;
            }
            J[(i + 24) >> 2] = 0;
            s = (a + 40) | 0;
            e = 7;
            while (1) {
              if (!e) {
                h = (0 - d) | 0;
                p = (i + 32) | 0;
                e = f;
                while (1) {
                  h: {
                    c = J[(i + 24) >> 2];
                    if (c) {
                      c = (c - 1) | 0;
                      J[(i + 24) >> 2] = c;
                      f = (p + (c << 4)) | 0;
                      c = J[f >> 2];
                      f = J[(f + 4) >> 2];
                      k = f;
                      if (c | f) {
                        break h;
                      }
                    }
                    c = J[(a + 4) >> 2];
                    b = ek(l, q, 16777259);
                    J[(c + (b << 2)) >> 2] = l;
                    H[(b + J[(a + 8) >> 2]) | 0] = e + 19;
                    break a;
                  }
                  f = J[(b + 12) >> 2];
                  g = J[(b + 8) >> 2];
                  J[(i + 8) >> 2] = g;
                  J[(i + 12) >> 2] = f;
                  j = J[(b + 4) >> 2];
                  m = J[b >> 2];
                  J[i >> 2] = m;
                  J[(i + 4) >> 2] = j;
                  n = J[(b + 20) >> 2];
                  o = J[(b + 16) >> 2];
                  J[(i + 16) >> 2] = o;
                  J[(i + 20) >> 2] = n;
                  J[(i + 8) >> 2] = c | g;
                  J[(i + 12) >> 2] = f | k;
                  J[i >> 2] = g ^ m;
                  J[(i + 4) >> 2] = f ^ j;
                  J[(i + 16) >> 2] = o + 1;
                  f = yd(a, i, h, (0 - e) | 0);
                  c = (0 - f) | 0;
                  if ((c | 0) >= (d | 0)) {
                    d = J[(a + 4) >> 2];
                    b = ek(l, q, 16777259);
                    J[(d + (b << 2)) >> 2] = l;
                    H[(b + J[(a + 8) >> 2]) | 0] = 56 - f;
                    e = c;
                    break a;
                  } else {
                    e = (c | 0) < (e | 0) ? e : c;
                    continue;
                  }
                }
              }
              e = (e - 1) | 0;
              g = P(J[((e << 2) + s) >> 2], 7);
              c = g & 31;
              if ((g & 63) >>> 0 >= 32) {
                g = 63 << c;
                c = 0;
              } else {
                g = ((1 << c) - 1) & (63 >>> (32 - c));
                c = 63 << c;
              }
              m = c & p;
              c = g & k;
              n = c;
              if (!(c | m)) {
                continue;
              }
              g = Hc(
                m | J[b >> 2],
                c | J[(b + 4) >> 2],
                J[(b + 8) >> 2],
                J[(b + 12) >> 2],
              );
              j = na;
              c = 0;
              while (1) {
                if (g | j) {
                  c = (c + 1) | 0;
                  h = g;
                  g = g & (g - 1);
                  j = j & (j - !h);
                  continue;
                }
                break;
              }
              g = c;
              h = (i + 24) | 0;
              c = J[h >> 2];
              J[h >> 2] = c + 1;
              o = (h + 8) | 0;
              while (1) {
                i: {
                  if (!c) {
                    break i;
                  }
                  h = ((c << 4) + o) | 0;
                  if ((g | 0) >= J[(h - 8) >> 2]) {
                    break i;
                  }
                  j = (h - 16) | 0;
                  r = J[(j + 12) >> 2];
                  J[(h + 8) >> 2] = J[(j + 8) >> 2];
                  J[(h + 12) >> 2] = r;
                  r = J[(j + 4) >> 2];
                  J[h >> 2] = J[j >> 2];
                  J[(h + 4) >> 2] = r;
                  c = (c - 1) | 0;
                  continue;
                }
                break;
              }
              c = ((c << 4) + o) | 0;
              J[(c + 8) >> 2] = g;
              J[c >> 2] = m;
              J[(c + 4) >> 2] = n;
              continue;
            }
          }
          ka = (i + 144) | 0;
          return e;
        }
        function pc(a, b, c, d, e) {
          var f = 0,
            g = 0,
            h = 0,
            i = 0,
            j = 0,
            k = 0;
          a: {
            b: {
              switch (fk((e - 2) | 0, 31) | 0) {
                case 4:
                  e = (c - b) | 0;
                  c: {
                    if ((e | 0) <= 9) {
                      f = (P((32 - S(d | 1)) | 0, 1233) >>> 12) | 0;
                      g = 61;
                      if (
                        (e | 0) <
                        ((((f - (M[((f << 2) + 14368) >> 2] > d >>> 0)) | 0) +
                          1) |
                          0)
                      ) {
                        break c;
                      }
                    }
                    d: {
                      if (d >>> 0 <= 999999) {
                        if (d >>> 0 <= 9999) {
                          if (d >>> 0 <= 99) {
                            if (d >>> 0 <= 9) {
                              H[b | 0] = d | 48;
                              c = (b + 1) | 0;
                              break d;
                            }
                            c = L[((d << 1) + 14416) >> 1];
                            H[b | 0] = c;
                            H[(b + 1) | 0] = c >>> 8;
                            c = (b + 2) | 0;
                            break d;
                          }
                          if (d >>> 0 <= 999) {
                            c = (((d & 65535) >>> 0) / 100) | 0;
                            H[b | 0] = c | 48;
                            c =
                              L[
                                ((((d - P(c, 100)) & 65535) << 1) + 14416) >> 1
                              ];
                            H[(b + 1) | 0] = c;
                            H[(b + 2) | 0] = c >>> 8;
                            c = (b + 3) | 0;
                            break d;
                          }
                          c = Oc(b, d);
                          break d;
                        }
                        if (d >>> 0 <= 99999) {
                          c = ((d >>> 0) / 1e4) | 0;
                          H[b | 0] = c + 48;
                          c = Oc((b + 1) | 0, (d - P(c, 1e4)) | 0);
                          break d;
                        }
                        c = Nc(b, d);
                        break d;
                      }
                      if (d >>> 0 <= 99999999) {
                        if (d >>> 0 <= 9999999) {
                          c = ((d >>> 0) / 1e6) | 0;
                          H[b | 0] = c + 48;
                          c = Nc((b + 1) | 0, (d - P(c, 1e6)) | 0);
                          break d;
                        }
                        c = Mc(b, d);
                        break d;
                      }
                      if (d >>> 0 <= 999999999) {
                        c = ((d >>> 0) / 1e8) | 0;
                        H[b | 0] = c + 48;
                        c = Mc((b + 1) | 0, (d - P(c, 1e8)) | 0);
                        break d;
                      }
                      c = ((d >>> 0) / 1e8) | 0;
                      e = L[((c << 1) + 14416) >> 1];
                      H[b | 0] = e;
                      H[(b + 1) | 0] = e >>> 8;
                      c = Mc((b + 2) | 0, (d - P(c, 1e8)) | 0);
                    }
                    g = 0;
                  }
                  J[(a + 4) >> 2] = g;
                  break a;
                case 0:
                  e = (32 - S(d | 1)) | 0;
                  if ((e | 0) > ((c - b) | 0)) {
                    b = 61;
                  } else {
                    c = (b + e) | 0;
                    b = c;
                    while (1) {
                      if (d >>> 0 < 17) {
                        while (1) {
                          b = (b - 1) | 0;
                          H[b | 0] = K[((d & 1) + 2022) | 0];
                          d = (d >>> 1) | 0;
                          if (d) {
                            continue;
                          }
                          break;
                        }
                      } else {
                        b = (b - 4) | 0;
                        e = J[(((d << 2) & 60) + 14624) >> 2];
                        H[b | 0] = e;
                        H[(b + 1) | 0] = e >>> 8;
                        H[(b + 2) | 0] = e >>> 16;
                        H[(b + 3) | 0] = e >>> 24;
                        d = (d >>> 4) | 0;
                        continue;
                      }
                      break;
                    }
                    b = 0;
                  }
                  J[(a + 4) >> 2] = b;
                  break a;
                case 3:
                  e = (((34 - S(d | 1)) >>> 0) / 3) | 0;
                  if ((e | 0) > ((c - b) | 0)) {
                    b = 61;
                  } else {
                    c = (b + e) | 0;
                    b = c;
                    while (1) {
                      if (d >>> 0 < 65) {
                        while (1) {
                          b = (b - 1) | 0;
                          H[b | 0] = K[((d & 7) + 2013) | 0];
                          d = (d >>> 3) | 0;
                          if (d) {
                            continue;
                          }
                          break;
                        }
                      } else {
                        b = (b - 2) | 0;
                        e = L[(((d << 1) & 126) + 14688) >> 1];
                        H[b | 0] = e;
                        H[(b + 1) | 0] = e >>> 8;
                        d = (d >>> 6) | 0;
                        continue;
                      }
                      break;
                    }
                    b = 0;
                  }
                  J[(a + 4) >> 2] = b;
                  break a;
                case 7:
                  e = ((35 - S(d | 1)) >>> 2) | 0;
                  if ((e | 0) > ((c - b) | 0)) {
                    b = 61;
                  } else {
                    c = (b + e) | 0;
                    b = c;
                    while (1) {
                      if (d >>> 0 < 257) {
                        while (1) {
                          b = (b - 1) | 0;
                          H[b | 0] = K[((d & 15) + 1729) | 0];
                          d = (d >>> 4) | 0;
                          if (d) {
                            continue;
                          }
                          break;
                        }
                      } else {
                        b = (b - 2) | 0;
                        e = L[(((d << 1) & 510) + 14816) >> 1];
                        H[b | 0] = e;
                        H[(b + 1) | 0] = e >>> 8;
                        d = (d >>> 8) | 0;
                        continue;
                      }
                      break;
                    }
                    b = 0;
                  }
                  J[(a + 4) >> 2] = b;
                  break a;
                default:
                  break b;
              }
            }
            f = d;
            i = P(e, e);
            k = P(i, e);
            j = P(i, i);
            e: {
              while (1) {
                g = h | 1;
                if (e >>> 0 > f >>> 0) {
                  break e;
                }
                g = h | 2;
                if (f >>> 0 < i >>> 0) {
                  break e;
                }
                g = h | 3;
                if (f >>> 0 < k >>> 0) {
                  break e;
                }
                if (f >>> 0 < j >>> 0) {
                  g = (h + 4) | 0;
                } else {
                  h = (h + 4) | 0;
                  f = ((f >>> 0) / (j >>> 0)) | 0;
                  continue;
                }
                break;
              }
            }
            f = g;
            if ((f | 0) > ((c - b) | 0)) {
              J[(a + 4) >> 2] = 61;
              break a;
            }
            f = (b + f) | 0;
            c = f;
            while (1) {
              c = (c - 1) | 0;
              b = ((d >>> 0) / (e >>> 0)) | 0;
              H[c | 0] = K[(((d - P(b, e)) | 0) + 1181) | 0];
              h = d >>> 0 >= e >>> 0;
              d = b;
              if (h) {
                continue;
              }
              break;
            }
            J[(a + 4) >> 2] = 0;
            J[a >> 2] = f;
            return;
          }
          J[a >> 2] = c;
        }
        function bf(a, b, c, d, e, f, g, h, i) {
          var j = 0,
            k = 0,
            l = 0,
            m = 0,
            n = 0,
            o = 0,
            p = 0,
            q = 0,
            r = 0,
            s = 0,
            t = 0;
          j = (ka - 128) | 0;
          ka = j;
          a: {
            b: {
              c: {
                if (!Fb(f, g, h, i, 0, 0, 0, 0)) {
                  break c;
                }
                k = i & 65535;
                m = (i >>> 16) & 32767;
                d: {
                  e: {
                    if ((m | 0) != 32767) {
                      n = 4;
                      if (m) {
                        break e;
                      }
                      n = f | h | (g | k) ? 3 : 2;
                      break d;
                    }
                    n = !(f | h | (g | k));
                  }
                }
                if (!n) {
                  break c;
                }
                s = (e >>> 16) | 0;
                p = s & 32767;
                if ((p | 0) != 32767) {
                  break b;
                }
              }
              Fa((j + 16) | 0, b, c, d, e, f, g, h, i);
              b = J[(j + 16) >> 2];
              d = J[(j + 20) >> 2];
              e = J[(j + 24) >> 2];
              c = J[(j + 28) >> 2];
              cf(j, b, d, e, c, b, d, e, c);
              d = J[(j + 8) >> 2];
              e = J[(j + 12) >> 2];
              h = J[j >> 2];
              i = J[(j + 4) >> 2];
              break a;
            }
            o = d;
            n = e & 2147483647;
            k = n;
            m = h;
            l = i & 2147483647;
            if ((Fb(b, c, o, k, f, g, h, l) | 0) <= 0) {
              if (Fb(b, c, o, k, f, g, h, l)) {
                h = b;
                i = c;
                break a;
              }
              Fa((j + 112) | 0, b, c, d, e, 0, 0, 0, 0);
              d = J[(j + 120) >> 2];
              e = J[(j + 124) >> 2];
              h = J[(j + 112) >> 2];
              i = J[(j + 116) >> 2];
              break a;
            }
            q = (i >>> 16) & 32767;
            if (p) {
              i = c;
              h = b;
            } else {
              Fa((j + 96) | 0, b, c, o, n, 0, 0, 0, 1081540608);
              o = J[(j + 104) >> 2];
              h = J[(j + 108) >> 2];
              n = h;
              p = (((h >>> 16) | 0) - 120) | 0;
              i = J[(j + 100) >> 2];
              h = J[(j + 96) >> 2];
            }
            if (!q) {
              Fa((j + 80) | 0, f, g, m, l, 0, 0, 0, 1081540608);
              m = J[(j + 88) >> 2];
              f = J[(j + 92) >> 2];
              l = f;
              q = (((f >>> 16) | 0) - 120) | 0;
              g = J[(j + 84) >> 2];
              f = J[(j + 80) >> 2];
            }
            r = m;
            t = (l & 65535) | 65536;
            n = (n & 65535) | 65536;
            if ((p | 0) > (q | 0)) {
              while (1) {
                l = (o - r) | 0;
                k =
                  (((g | 0) == (i | 0)) & (f >>> 0 > h >>> 0)) |
                  (g >>> 0 > i >>> 0);
                m = (l - k) | 0;
                k =
                  (((n - (((o >>> 0 < r >>> 0) + t) | 0)) | 0) -
                    (k >>> 0 > l >>> 0)) |
                  0;
                f: {
                  if (((k | 0) >= 0) | ((k | 0) > 0)) {
                    o = h;
                    h = (h - f) | 0;
                    i = (i - (((f >>> 0 > o >>> 0) + g) | 0)) | 0;
                    if (!(h | m | (i | k))) {
                      Fa((j + 32) | 0, b, c, d, e, 0, 0, 0, 0);
                      d = J[(j + 40) >> 2];
                      e = J[(j + 44) >> 2];
                      h = J[(j + 32) >> 2];
                      i = J[(j + 36) >> 2];
                      break a;
                    }
                    k = (k << 1) | (m >>> 31);
                    o = (m << 1) | (i >>> 31);
                    break f;
                  }
                  k = (n << 1) | (o >>> 31);
                  o = (o << 1) | (i >>> 31);
                }
                n = k;
                k = (i << 1) | (h >>> 31);
                h = h << 1;
                i = k;
                p = (p - 1) | 0;
                if ((q | 0) < (p | 0)) {
                  continue;
                }
                break;
              }
              p = q;
            }
            l = (o - r) | 0;
            k =
              (((g | 0) == (i | 0)) & (f >>> 0 > h >>> 0)) |
              (g >>> 0 > i >>> 0);
            m = (l - k) | 0;
            k =
              (((n - (((o >>> 0 < r >>> 0) + t) | 0)) | 0) -
                (k >>> 0 > l >>> 0)) |
              0;
            l = k;
            g: {
              if ((k | 0) < 0) {
                m = o;
                l = n;
                break g;
              }
              o = h;
              h = (h - f) | 0;
              i = (i - (((f >>> 0 > o >>> 0) + g) | 0)) | 0;
              if (h | m | (i | l)) {
                break g;
              }
              Fa((j + 48) | 0, b, c, d, e, 0, 0, 0, 0);
              d = J[(j + 56) >> 2];
              e = J[(j + 60) >> 2];
              h = J[(j + 48) >> 2];
              i = J[(j + 52) >> 2];
              break a;
            }
            if (((l | 0) == 65535) | (l >>> 0 < 65535)) {
              while (1) {
                b = (i >>> 31) | 0;
                p = (p - 1) | 0;
                n = (i << 1) | (h >>> 31);
                h = h << 1;
                i = n;
                c = b;
                b = (l << 1) | (m >>> 31);
                m = c | (m << 1);
                l = b;
                if (b >>> 0 < 65536) {
                  continue;
                }
                break;
              }
            }
            b = s & 32768;
            if ((p | 0) <= 0) {
              Fa(
                (j - -64) | 0,
                h,
                i,
                m,
                (l & 65535) | ((b | (p + 120)) << 16),
                0,
                0,
                0,
                1065811968,
              );
              d = J[(j + 72) >> 2];
              e = J[(j + 76) >> 2];
              h = J[(j + 64) >> 2];
              i = J[(j + 68) >> 2];
              break a;
            }
            d = m;
            e = (l & 65535) | ((b | p) << 16);
          }
          J[a >> 2] = h;
          J[(a + 4) >> 2] = i;
          J[(a + 8) >> 2] = d;
          J[(a + 12) >> 2] = e;
          ka = (j + 128) | 0;
        }
        function sg(a) {
          a = a | 0;
          var b = 0,
            c = 0,
            d = 0,
            e = 0,
            f = 0,
            g = 0,
            h = 0,
            i = 0,
            j = 0,
            k = 0,
            l = 0,
            m = 0,
            n = 0,
            o = 0,
            p = 0;
          e = (ka + -64) | 0;
          ka = e;
          j = Eb((e + 52) | 0, a);
          J[(e + 32) >> 2] = 0;
          J[(e + 36) >> 2] = 0;
          J[(e + 24) >> 2] = 0;
          J[(e + 28) >> 2] = 0;
          J[(e + 40) >> 2] = 0;
          l = Wa(36);
          c = (e + 24) | 0;
          a: {
            while (1) {
              a = H[(j + 11) | 0];
              d = (a | 0) < 0;
              a = d ? J[(j + 4) >> 2] : a;
              if (b >>> 0 >= a >>> 0) {
                break a;
              }
              b: {
                a = H[((d ? J[j >> 2] : j) + b) | 0];
                if (((a - 56) & 255) >>> 0 < 249) {
                  break b;
                }
                f = J[(c + 12) >> 2];
                h = J[(c + 8) >> 2];
                d = (a - 49) | 0;
                g = (P(d, 7) + 5) | 0;
                a = g & 31;
                if ((g & 63) >>> 0 >= 32) {
                  a = (f >>> a) | 0;
                } else {
                  a = ((((1 << a) - 1) & f) << (32 - a)) | (h >>> a);
                }
                if (a & 1) {
                  break b;
                }
                if (Ic(c, d)) {
                  break b;
                }
                Fd(c, d);
                b = (b + 1) | 0;
                continue;
              }
              break;
            }
            a = b;
          }
          d = H[(j + 11) | 0];
          b = (d | 0) < 0;
          c: {
            if (((b ? J[(j + 4) >> 2] : d) | 0) != (a | 0)) {
              ((o = l),
                (p = Ic(
                  c,
                  (H[(J[(e + 40) >> 2] + (b ? J[j >> 2] : j)) | 0] - 49) | 0,
                )
                  ? 1
                  : 2),
                (J[o >> 2] = p));
              J[(l + 4) >> 2] = J[(e + 40) >> 2];
              a = 0;
              while (1) {
                if ((a | 0) == 7) {
                  break c;
                }
                J[((((a << 2) + l) | 0) + 8) >> 2] = 0;
                a = (a + 1) | 0;
                continue;
              }
            }
            a = 0;
            J[l >> 2] = 0;
            J[(l + 4) >> 2] = J[(e + 40) >> 2];
            g = (ka - 32) | 0;
            ka = g;
            J[(g + 8) >> 2] = -1e3;
            c = (ka - 16) | 0;
            ka = c;
            b = (e + 12) | 0;
            J[(b + 8) >> 2] = 0;
            J[b >> 2] = 0;
            J[(b + 4) >> 2] = 0;
            J[(c + 8) >> 2] = b;
            d = za(28);
            J[(b + 4) >> 2] = d;
            J[b >> 2] = d;
            J[(b + 8) >> 2] = d + 28;
            d = J[(b + 4) >> 2];
            f = (d + 28) | 0;
            while (1) {
              if ((d | 0) == (f | 0)) {
                J[(b + 4) >> 2] = f;
              } else {
                J[d >> 2] = J[(g + 8) >> 2];
                d = (d + 4) | 0;
                continue;
              }
              break;
            }
            H[(c + 12) | 0] = 1;
            d = (c + 8) | 0;
            if (!K[(d + 4) | 0]) {
              Yf(d);
            }
            f = (e + 24) | 0;
            ka = (c + 16) | 0;
            d = b;
            while (1) {
              if (((i | 0) != 7) | m) {
                c = J[(f + 12) >> 2];
                h = J[(f + 8) >> 2];
                k = dk(i, m, 7, 0);
                b = k & 31;
                if ((k & 63) >>> 0 >= 32) {
                  b = (c >>> b) | 0;
                } else {
                  b = ((((1 << b) - 1) & c) << (32 - b)) | (h >>> b);
                }
                d: {
                  if (b & 32) {
                    break d;
                  }
                  if (Ic(f, i)) {
                    J[(J[d >> 2] + (i << 2)) >> 2] =
                      ((43 - J[(f + 16) >> 2]) | 0) / 2;
                    break d;
                  }
                  b = J[(f + 20) >> 2];
                  J[(g + 24) >> 2] = J[(f + 16) >> 2];
                  J[(g + 28) >> 2] = b;
                  b = J[(f + 12) >> 2];
                  J[(g + 16) >> 2] = J[(f + 8) >> 2];
                  J[(g + 20) >> 2] = b;
                  b = J[(f + 4) >> 2];
                  J[(g + 8) >> 2] = J[f >> 2];
                  J[(g + 12) >> 2] = b;
                  n = (g + 8) | 0;
                  Fd(n, i);
                  c = Gc(n);
                  b = J[(n + 16) >> 2];
                  e: {
                    if (c) {
                      h = (((43 - b) | 0) / 2) | 0;
                      break e;
                    }
                    k = (((43 - b) | 0) / 2) | 0;
                    h = (((b - 42) | 0) / 2) | 0;
                    while (1) {
                      if ((h | 0) >= (k | 0)) {
                        break e;
                      }
                      b = ((((k - h) >>> 1) | 0) + h) | 0;
                      c = ((h | 0) / 2) | 0;
                      f: {
                        if (((b | 0) <= 0) & ((b | 0) > (c | 0))) {
                          break f;
                        }
                        if ((b | 0) < 0) {
                          c = b;
                          break f;
                        }
                        c = ((k | 0) / 2) | 0;
                        c = (b | 0) < (c | 0) ? c : b;
                      }
                      b = yd(16560, n, c, (c + 1) | 0);
                      c = (b | 0) > (c | 0);
                      k = c ? k : b;
                      h = c ? b : h;
                      continue;
                    }
                  }
                  J[(J[d >> 2] + (i << 2)) >> 2] = 0 - h;
                }
                i = (i + 1) | 0;
                m = i ? m : (m + 1) | 0;
                continue;
              }
              break;
            }
            ka = (g + 32) | 0;
            i = J[(e + 12) >> 2];
            while (1) {
              if ((a | 0) == 7) {
                a = (ka - 16) | 0;
                ka = a;
                J[(a + 12) >> 2] = e + 12;
                Yf((a + 12) | 0);
                ka = (a + 16) | 0;
              } else {
                m = a << 2;
                J[(((m + l) | 0) + 8) >> 2] = J[(i + m) >> 2];
                a = (a + 1) | 0;
                continue;
              }
              break;
            }
          }
          ya(j);
          ka = (e - -64) | 0;
          return l | 0;
        }
        function me(a) {
          var b = 0,
            c = 0,
            d = 0;
          if (!K[21152]) {
            if (!K[21144]) {
              J[5246] = 7768;
              J[5247] = 0;
              H[21124] = 0;
              J[5250] = 0;
              J[5248] = 0;
              J[5249] = 0;
              b = Wd(30);
              J[5249] = b;
              J[5248] = b;
              J[5250] = b + 120;
              pe(30);
              Eb(21128, 1956);
              J[5249] = J[5248];
              J[5603] = 10360;
              J[5604] = 0;
              Ja(22412, Ga(20816));
              J[5605] = 10392;
              J[5606] = 0;
              Ja(22420, Ga(20824));
              J[5607] = 7788;
              J[5609] = 7840;
              H[22440] = 0;
              J[5608] = 0;
              Ja(22428, Ga(21168));
              J[5611] = 9304;
              J[5612] = 0;
              Ja(22444, Ga(21160));
              J[5613] = 9456;
              J[5614] = 0;
              Ja(22452, Ga(21176));
              J[5615] = 8872;
              J[5616] = 0;
              ((c = 22468), (d = Xa()), (J[c >> 2] = d));
              Ja(22460, Ga(21184));
              J[5618] = 9604;
              J[5619] = 0;
              Ja(22472, Ga(21192));
              J[5620] = 9836;
              J[5621] = 0;
              Ja(22480, Ga(21208));
              J[5622] = 9720;
              J[5623] = 0;
              Ja(22488, Ga(21200));
              J[5624] = 9952;
              J[5625] = 0;
              Ja(22496, Ga(21216));
              J[5629] = 0;
              J[5630] = 0;
              I[11256] = 11310;
              J[5626] = 8920;
              J[5627] = 0;
              J[5631] = 0;
              Ja(22504, Ga(21224));
              J[5636] = 0;
              J[5637] = 0;
              J[5635] = 44;
              J[5632] = 8960;
              J[5633] = 0;
              J[5634] = 46;
              J[5638] = 0;
              Ja(22528, Ga(21232));
              J[5639] = 10424;
              J[5640] = 0;
              Ja(22556, Ga(20832));
              J[5641] = 10672;
              J[5642] = 0;
              Ja(22564, Ga(20840));
              J[5643] = 10884;
              J[5644] = 0;
              Ja(22572, Ga(20848));
              J[5645] = 11120;
              J[5646] = 0;
              Ja(22580, Ga(20856));
              J[5647] = 12116;
              J[5648] = 0;
              Ja(22588, Ga(20896));
              J[5649] = 12264;
              J[5650] = 0;
              Ja(22596, Ga(20904));
              J[5651] = 12380;
              J[5652] = 0;
              Ja(22604, Ga(20912));
              J[5653] = 12496;
              J[5654] = 0;
              Ja(22612, Ga(20920));
              J[5655] = 12612;
              J[5656] = 0;
              Ja(22620, Ga(20928));
              J[5657] = 12780;
              J[5658] = 0;
              Ja(22628, Ga(20936));
              J[5659] = 12948;
              J[5660] = 0;
              Ja(22636, Ga(20944));
              J[5661] = 13116;
              J[5662] = 0;
              Ja(22644, Ga(20952));
              J[5665] = 11368;
              J[5663] = 11320;
              J[5664] = 0;
              Ja(22652, Ga(20864));
              J[5668] = 11636;
              J[5666] = 11588;
              J[5667] = 0;
              Ja(22664, Ga(20872));
              J[5669] = 9248;
              J[5670] = 0;
              b = Xa();
              J[5669] = 11828;
              J[5671] = b;
              Ja(22676, Ga(20880));
              J[5672] = 9248;
              J[5673] = 0;
              b = Xa();
              J[5672] = 11988;
              J[5674] = b;
              Ja(22688, Ga(20888));
              J[5675] = 13284;
              J[5676] = 0;
              Ja(22700, Ga(20960));
              J[5677] = 13404;
              J[5678] = 0;
              Ja(22708, Ga(20968));
              H[21144] = 1;
              J[5285] = 20984;
            }
            b = J[5285];
            J[5287] = b;
            if ((b | 0) != 20984) {
              J[(b + 4) >> 2] = J[(b + 4) >> 2] + 1;
            }
            H[21152] = 1;
          }
          b = a;
          a = J[5287];
          J[b >> 2] = a;
          if ((a | 0) != 20984) {
            J[(a + 4) >> 2] = J[(a + 4) >> 2] + 1;
          }
        }
        function Xf(a, b) {
          var c = 0,
            d = 0,
            e = 0,
            f = 0,
            g = 0,
            h = 0,
            i = 0,
            j = 0,
            k = 0,
            l = 0,
            m = 0,
            n = 0,
            o = 0;
          if (!a) {
            return Wa(b);
          }
          if (b >>> 0 >= 4294967232) {
            J[4158] = 48;
            return 0;
          }
          g = b >>> 0 < 11 ? 16 : (b + 11) & -8;
          i = (a - 8) | 0;
          j = J[(i + 4) >> 2];
          e = j & -8;
          a: {
            if (!(j & 3)) {
              if (g >>> 0 < 256) {
                break a;
              }
              if (e >>> 0 >= (g + 4) >>> 0) {
                c = i;
                if ((e - g) >>> 0 <= (J[4279] << 1) >>> 0) {
                  break a;
                }
              }
              c = 0;
              break a;
            }
            h = (e + i) | 0;
            b: {
              if (e >>> 0 >= g >>> 0) {
                d = (e - g) | 0;
                if (d >>> 0 < 16) {
                  break b;
                }
                J[(i + 4) >> 2] = (j & 1) | g | 2;
                c = (g + i) | 0;
                J[(c + 4) >> 2] = d | 3;
                J[(h + 4) >> 2] = J[(h + 4) >> 2] | 1;
                Wf(c, d);
                break b;
              }
              if (J[4165] == (h | 0)) {
                e = (e + J[4162]) | 0;
                if (e >>> 0 <= g >>> 0) {
                  break a;
                }
                J[(i + 4) >> 2] = (j & 1) | g | 2;
                d = (g + i) | 0;
                c = (e - g) | 0;
                J[(d + 4) >> 2] = c | 1;
                J[4162] = c;
                J[4165] = d;
                break b;
              }
              if (J[4164] == (h | 0)) {
                e = (e + J[4161]) | 0;
                if (e >>> 0 < g >>> 0) {
                  break a;
                }
                c = (e - g) | 0;
                c: {
                  if (c >>> 0 >= 16) {
                    J[(i + 4) >> 2] = (j & 1) | g | 2;
                    d = (g + i) | 0;
                    J[(d + 4) >> 2] = c | 1;
                    e = (e + i) | 0;
                    J[e >> 2] = c;
                    J[(e + 4) >> 2] = J[(e + 4) >> 2] & -2;
                    break c;
                  }
                  J[(i + 4) >> 2] = e | (j & 1) | 2;
                  c = (e + i) | 0;
                  J[(c + 4) >> 2] = J[(c + 4) >> 2] | 1;
                  c = 0;
                }
                J[4164] = d;
                J[4161] = c;
                break b;
              }
              d = J[(h + 4) >> 2];
              if (d & 2) {
                break a;
              }
              k = (e + (d & -8)) | 0;
              if (k >>> 0 < g >>> 0) {
                break a;
              }
              m = (k - g) | 0;
              f = J[(h + 12) >> 2];
              d: {
                if (d >>> 0 <= 255) {
                  c = J[(h + 8) >> 2];
                  if ((c | 0) == (f | 0)) {
                    ((n = 16636),
                      (o = J[4159] & fk(-2, (d >>> 3) | 0)),
                      (J[n >> 2] = o));
                    break d;
                  }
                  J[(c + 12) >> 2] = f;
                  J[(f + 8) >> 2] = c;
                  break d;
                }
                l = J[(h + 24) >> 2];
                e: {
                  if ((f | 0) != (h | 0)) {
                    c = J[(h + 8) >> 2];
                    J[(c + 12) >> 2] = f;
                    J[(f + 8) >> 2] = c;
                    break e;
                  }
                  f: {
                    c = J[(h + 20) >> 2];
                    if (c) {
                      d = (h + 20) | 0;
                    } else {
                      c = J[(h + 16) >> 2];
                      if (!c) {
                        break f;
                      }
                      d = (h + 16) | 0;
                    }
                    while (1) {
                      e = d;
                      f = c;
                      d = (c + 20) | 0;
                      c = J[(c + 20) >> 2];
                      if (c) {
                        continue;
                      }
                      d = (f + 16) | 0;
                      c = J[(f + 16) >> 2];
                      if (c) {
                        continue;
                      }
                      break;
                    }
                    J[e >> 2] = 0;
                    break e;
                  }
                  f = 0;
                }
                if (!l) {
                  break d;
                }
                d = J[(h + 28) >> 2];
                c = d << 2;
                g: {
                  if (J[(c + 16940) >> 2] == (h | 0)) {
                    J[(c + 16940) >> 2] = f;
                    if (f) {
                      break g;
                    }
                    ((n = 16640), (o = J[4160] & fk(-2, d)), (J[n >> 2] = o));
                    break d;
                  }
                  h: {
                    if (J[(l + 16) >> 2] == (h | 0)) {
                      J[(l + 16) >> 2] = f;
                      break h;
                    }
                    J[(l + 20) >> 2] = f;
                  }
                  if (!f) {
                    break d;
                  }
                }
                J[(f + 24) >> 2] = l;
                c = J[(h + 16) >> 2];
                if (c) {
                  J[(f + 16) >> 2] = c;
                  J[(c + 24) >> 2] = f;
                }
                c = J[(h + 20) >> 2];
                if (!c) {
                  break d;
                }
                J[(f + 20) >> 2] = c;
                J[(c + 24) >> 2] = f;
              }
              if (m >>> 0 <= 15) {
                J[(i + 4) >> 2] = (j & 1) | k | 2;
                c = (i + k) | 0;
                J[(c + 4) >> 2] = J[(c + 4) >> 2] | 1;
                break b;
              }
              J[(i + 4) >> 2] = (j & 1) | g | 2;
              d = (g + i) | 0;
              J[(d + 4) >> 2] = m | 3;
              c = (i + k) | 0;
              J[(c + 4) >> 2] = J[(c + 4) >> 2] | 1;
              Wf(d, m);
            }
            c = i;
          }
          if (c) {
            return (c + 8) | 0;
          }
          d = Wa(b);
          if (!d) {
            return 0;
          }
          c = J[(a - 4) >> 2];
          c = ((c & 3 ? -4 : -8) + (c & -8)) | 0;
          vb(d, a, b >>> 0 > c >>> 0 ? c : b);
          Aa(a);
          return d;
        }
        function Kj(a, b) {
          a = a | 0;
          b = b | 0;
          var c = 0,
            d = 0,
            e = 0,
            f = 0,
            g = 0,
            h = 0,
            i = 0,
            j = 0;
          e = (ka - 16) | 0;
          ka = e;
          a: {
            b: {
              c: {
                if (!J[(a + 64) >> 2]) {
                  break c;
                }
                c = a;
                if (!(K[(c + 92) | 0] & 16)) {
                  J[(c + 16) >> 2] = 0;
                  J[(c + 8) >> 2] = 0;
                  J[(c + 12) >> 2] = 0;
                  h = J[(c + 52) >> 2];
                  a = 0;
                  d: {
                    if (h >>> 0 < 9) {
                      break d;
                    }
                    if (K[(c + 98) | 0] == 1) {
                      d = J[(c + 32) >> 2];
                      a = (((h + d) | 0) - 1) | 0;
                      break d;
                    }
                    d = J[(c + 56) >> 2];
                    a = (((d + J[(c + 60) >> 2]) | 0) - 1) | 0;
                  }
                  J[(c + 92) >> 2] = 16;
                  J[(c + 28) >> 2] = a;
                  J[(c + 20) >> 2] = d;
                  J[(c + 24) >> 2] = d;
                }
                f = J[(c + 24) >> 2];
                i = J[(c + 28) >> 2];
                h = J[(c + 20) >> 2];
                d = (b | 0) != -1 ? b : 0;
                if ((b | 0) == -1) {
                  g = h;
                } else {
                  if (!f) {
                    J[(c + 28) >> 2] = e + 16;
                    f = (e + 15) | 0;
                    J[(c + 20) >> 2] = f;
                    J[(c + 24) >> 2] = f;
                  }
                  H[f | 0] = b;
                  f = (J[(c + 24) >> 2] + 1) | 0;
                  J[(c + 24) >> 2] = f;
                  g = J[(c + 20) >> 2];
                }
                a = g;
                if ((a | 0) == (f | 0)) {
                  break b;
                }
                e: {
                  f: {
                    g: {
                      if (K[(c + 98) | 0] == 1) {
                        a = (f - a) | 0;
                        if ((ab(g, 1, a, J[(c + 64) >> 2]) | 0) == (a | 0)) {
                          break g;
                        }
                        d = -1;
                        a = J[(c + 24) >> 2];
                        if ((a | 0) != ((J[(c + 28) >> 2] + 1) | 0)) {
                          break b;
                        }
                        J[(c + 24) >> 2] = a - 1;
                        break b;
                      }
                      d = J[(c + 68) >> 2];
                      if (!d) {
                        break a;
                      }
                      g = J[(c + 32) >> 2];
                      J[(e + 4) >> 2] = g;
                      j = (c + 72) | 0;
                      while (1) {
                        d =
                          oa[J[(J[d >> 2] + 12) >> 2]](
                            d,
                            j,
                            a,
                            f,
                            (e + 8) | 0,
                            g,
                            (J[(c + 52) >> 2] + g) | 0,
                            (e + 4) | 0,
                          ) | 0;
                        if (J[(e + 8) >> 2] == (a | 0)) {
                          a = J[(c + 24) >> 2];
                          if ((a | 0) == ((J[(c + 28) >> 2] + 1) | 0)) {
                            break e;
                          }
                          break c;
                        }
                        h: {
                          switch (d | 0) {
                            case 3:
                              g = a;
                              a = (f - a) | 0;
                              if (
                                (ab(g, 1, a, J[(c + 64) >> 2]) | 0) ==
                                (a | 0)
                              ) {
                                break g;
                              }
                              a = J[(c + 24) >> 2];
                              if ((a | 0) == ((J[(c + 28) >> 2] + 1) | 0)) {
                                break e;
                              }
                              break c;
                            case 0:
                              d = J[(c + 32) >> 2];
                              a = (J[(e + 4) >> 2] - d) | 0;
                              if (
                                (ab(d, 1, a, J[(c + 64) >> 2]) | 0) ==
                                (a | 0)
                              ) {
                                break g;
                              }
                              a = J[(c + 24) >> 2];
                              if ((a | 0) == ((J[(c + 28) >> 2] + 1) | 0)) {
                                break e;
                              }
                              break c;
                            case 1:
                              break h;
                            default:
                              break f;
                          }
                        }
                        d = J[(c + 32) >> 2];
                        a = (J[(e + 4) >> 2] - d) | 0;
                        if ((ab(d, 1, a, J[(c + 64) >> 2]) | 0) != (a | 0)) {
                          a = J[(c + 24) >> 2];
                          if ((a | 0) == ((J[(c + 28) >> 2] + 1) | 0)) {
                            break e;
                          }
                          break c;
                        } else {
                          g = J[(c + 32) >> 2];
                          d = J[(c + 68) >> 2];
                          a = J[(e + 8) >> 2];
                          continue;
                        }
                      }
                    }
                    J[(c + 28) >> 2] = i;
                    J[(c + 20) >> 2] = h;
                    J[(c + 24) >> 2] = h;
                    d = (b | 0) != -1 ? b : 0;
                    break b;
                  }
                  a = J[(c + 24) >> 2];
                  if ((a | 0) != ((J[(c + 28) >> 2] + 1) | 0)) {
                    break c;
                  }
                }
                J[(c + 24) >> 2] = a - 1;
              }
              d = -1;
            }
            ka = (e + 16) | 0;
            return d | 0;
          }
          Oa();
          y();
        }
        function Si(a, b, c, d, e, f) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          f = f | 0;
          var g = 0,
            h = 0;
          a = (ka - 288) | 0;
          ka = a;
          J[(a + 280) >> 2] = c;
          J[(a + 284) >> 2] = b;
          _c((a + 224) | 0, d, (a + 240) | 0, (a + 239) | 0, (a + 238) | 0);
          J[(a + 216) >> 2] = 0;
          J[(a + 208) >> 2] = 0;
          J[(a + 212) >> 2] = 0;
          b = (a + 208) | 0;
          Ba(b, 10);
          b = H[(a + 219) | 0] < 0 ? J[(a + 208) >> 2] : b;
          J[(a + 204) >> 2] = b;
          J[(a + 28) >> 2] = a + 32;
          J[(a + 24) >> 2] = 0;
          H[(a + 23) | 0] = 1;
          H[(a + 22) | 0] = 69;
          c = 0;
          while (1) {
            a: {
              b: {
                c: {
                  d: {
                    if (Ma((a + 284) | 0, (a + 280) | 0)) {
                      break d;
                    }
                    d = H[(a + 219) | 0];
                    d = (d | 0) < 0 ? J[(a + 212) >> 2] : d;
                    if (J[(a + 204) >> 2] == ((d + b) | 0)) {
                      b = (a + 208) | 0;
                      Ba(b, d << 1);
                      Ba(
                        b,
                        H[(a + 219) | 0] >= 0
                          ? 10
                          : ((J[(a + 216) >> 2] & 2147483647) - 1) | 0,
                      );
                      b = H[(a + 219) | 0] < 0 ? J[(a + 208) >> 2] : b;
                      J[(a + 204) >> 2] = d + b;
                    }
                    if (
                      Zc(
                        ($a(J[(a + 284) >> 2]) << 24) >> 24,
                        (a + 23) | 0,
                        (a + 22) | 0,
                        b,
                        (a + 204) | 0,
                        H[(a + 239) | 0],
                        H[(a + 238) | 0],
                        (a + 224) | 0,
                        (a + 32) | 0,
                        (a + 28) | 0,
                        (a + 24) | 0,
                        (a + 240) | 0,
                      )
                    ) {
                      break d;
                    }
                    if (c) {
                      break c;
                    }
                    c = 0;
                    g = (J[(a + 204) >> 2] - b) | 0;
                    if ((g | 0) <= 0) {
                      break b;
                    }
                    e: {
                      f: {
                        d = K[b | 0];
                        h = (d - 43) | 0;
                        switch (h | 0) {
                          case 0:
                          case 2:
                            break e;
                          default:
                            break f;
                        }
                      }
                      if ((d | 0) == 46) {
                        break c;
                      }
                      c = 1;
                      if (((d - 48) & 255) >>> 0 < 10) {
                        break b;
                      }
                      break d;
                    }
                    if ((g | 0) == 1) {
                      break b;
                    }
                    g: {
                      switch (h | 0) {
                        case 0:
                        case 2:
                          break g;
                        default:
                          break b;
                      }
                    }
                    d = K[(b + 1) | 0];
                    if ((d | 0) == 46) {
                      break c;
                    }
                    c = 1;
                    if (((d - 48) & 255) >>> 0 <= 9) {
                      break b;
                    }
                  }
                  c = H[(a + 235) | 0];
                  h: {
                    if (
                      !((c | 0) < 0 ? J[(a + 228) >> 2] : c) |
                      !(H[(a + 23) | 0] & 1)
                    ) {
                      break h;
                    }
                    c = J[(a + 28) >> 2];
                    if (((c - ((a + 32) | 0)) | 0) > 159) {
                      break h;
                    }
                    J[(a + 28) >> 2] = c + 4;
                    J[c >> 2] = J[(a + 24) >> 2];
                  }
                  Me(a, b, J[(a + 204) >> 2], e);
                  b = J[a >> 2];
                  c = J[(a + 4) >> 2];
                  d = J[(a + 12) >> 2];
                  J[(f + 8) >> 2] = J[(a + 8) >> 2];
                  J[(f + 12) >> 2] = d;
                  J[f >> 2] = b;
                  J[(f + 4) >> 2] = c;
                  Va((a + 224) | 0, (a + 32) | 0, J[(a + 28) >> 2], e);
                  if (Ma((a + 284) | 0, (a + 280) | 0)) {
                    J[e >> 2] = J[e >> 2] | 2;
                  }
                  b = J[(a + 284) >> 2];
                  ya((a + 208) | 0);
                  ya((a + 224) | 0);
                  ka = (a + 288) | 0;
                  break a;
                }
                c = 1;
              }
              db(J[(a + 284) >> 2]);
              continue;
            }
            break;
          }
          return b | 0;
        }
        function Ii(a, b, c, d, e, f) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          f = f | 0;
          var g = 0,
            h = 0;
          a = (ka - 368) | 0;
          ka = a;
          J[(a + 360) >> 2] = c;
          J[(a + 364) >> 2] = b;
          Xc((a + 220) | 0, d, (a + 240) | 0, (a + 236) | 0, (a + 232) | 0);
          J[(a + 216) >> 2] = 0;
          J[(a + 208) >> 2] = 0;
          J[(a + 212) >> 2] = 0;
          b = (a + 208) | 0;
          Ba(b, 10);
          b = H[(a + 219) | 0] < 0 ? J[(a + 208) >> 2] : b;
          J[(a + 204) >> 2] = b;
          J[(a + 28) >> 2] = a + 32;
          J[(a + 24) >> 2] = 0;
          H[(a + 23) | 0] = 1;
          H[(a + 22) | 0] = 69;
          c = 0;
          while (1) {
            a: {
              b: {
                c: {
                  d: {
                    if (La((a + 364) | 0, (a + 360) | 0)) {
                      break d;
                    }
                    d = H[(a + 219) | 0];
                    d = (d | 0) < 0 ? J[(a + 212) >> 2] : d;
                    if (J[(a + 204) >> 2] == ((d + b) | 0)) {
                      b = (a + 208) | 0;
                      Ba(b, d << 1);
                      Ba(
                        b,
                        H[(a + 219) | 0] >= 0
                          ? 10
                          : ((J[(a + 216) >> 2] & 2147483647) - 1) | 0,
                      );
                      b = H[(a + 219) | 0] < 0 ? J[(a + 208) >> 2] : b;
                      J[(a + 204) >> 2] = d + b;
                    }
                    if (
                      Wc(
                        _a(J[(a + 364) >> 2]),
                        (a + 23) | 0,
                        (a + 22) | 0,
                        b,
                        (a + 204) | 0,
                        J[(a + 236) >> 2],
                        J[(a + 232) >> 2],
                        (a + 220) | 0,
                        (a + 32) | 0,
                        (a + 28) | 0,
                        (a + 24) | 0,
                        (a + 240) | 0,
                      )
                    ) {
                      break d;
                    }
                    if (c) {
                      break c;
                    }
                    c = 0;
                    g = (J[(a + 204) >> 2] - b) | 0;
                    if ((g | 0) <= 0) {
                      break b;
                    }
                    e: {
                      f: {
                        d = K[b | 0];
                        h = (d - 43) | 0;
                        switch (h | 0) {
                          case 0:
                          case 2:
                            break e;
                          default:
                            break f;
                        }
                      }
                      if ((d | 0) == 46) {
                        break c;
                      }
                      c = 1;
                      if (((d - 48) & 255) >>> 0 < 10) {
                        break b;
                      }
                      break d;
                    }
                    if ((g | 0) == 1) {
                      break b;
                    }
                    g: {
                      switch (h | 0) {
                        case 0:
                        case 2:
                          break g;
                        default:
                          break b;
                      }
                    }
                    d = K[(b + 1) | 0];
                    if ((d | 0) == 46) {
                      break c;
                    }
                    c = 1;
                    if (((d - 48) & 255) >>> 0 <= 9) {
                      break b;
                    }
                  }
                  c = H[(a + 231) | 0];
                  h: {
                    if (
                      !((c | 0) < 0 ? J[(a + 224) >> 2] : c) |
                      !(H[(a + 23) | 0] & 1)
                    ) {
                      break h;
                    }
                    c = J[(a + 28) >> 2];
                    if (((c - ((a + 32) | 0)) | 0) > 159) {
                      break h;
                    }
                    J[(a + 28) >> 2] = c + 4;
                    J[c >> 2] = J[(a + 24) >> 2];
                  }
                  Me(a, b, J[(a + 204) >> 2], e);
                  b = J[a >> 2];
                  c = J[(a + 4) >> 2];
                  d = J[(a + 12) >> 2];
                  J[(f + 8) >> 2] = J[(a + 8) >> 2];
                  J[(f + 12) >> 2] = d;
                  J[f >> 2] = b;
                  J[(f + 4) >> 2] = c;
                  Va((a + 220) | 0, (a + 32) | 0, J[(a + 28) >> 2], e);
                  if (La((a + 364) | 0, (a + 360) | 0)) {
                    J[e >> 2] = J[e >> 2] | 2;
                  }
                  b = J[(a + 364) >> 2];
                  ya((a + 208) | 0);
                  ya((a + 220) | 0);
                  ka = (a + 368) | 0;
                  break a;
                }
                c = 1;
              }
              cb(J[(a + 364) >> 2]);
              continue;
            }
            break;
          }
          return b | 0;
        }
        function Bh(a, b, c, d, e, f, g, h) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          f = f | 0;
          g = g | 0;
          h = h | 0;
          var i = 0,
            j = 0,
            k = 0,
            l = 0,
            m = 0,
            n = 0,
            o = 0,
            p = 0,
            q = 0,
            r = 0,
            s = 0,
            t = 0,
            u = 0;
          n = (ka - 16) | 0;
          ka = n;
          i = c;
          while (1) {
            a: {
              if ((d | 0) == (i | 0)) {
                i = d;
                break a;
              }
              if (!J[i >> 2]) {
                break a;
              }
              i = (i + 4) | 0;
              continue;
            }
            break;
          }
          J[h >> 2] = f;
          J[e >> 2] = c;
          b: {
            while (1) {
              c: {
                d: {
                  if (!(((c | 0) == (d | 0)) | ((f | 0) == (g | 0)))) {
                    j = J[(b + 4) >> 2];
                    J[(n + 8) >> 2] = J[b >> 2];
                    J[(n + 12) >> 2] = j;
                    s = 1;
                    p = (ka - 16) | 0;
                    ka = p;
                    ((t = p),
                      (u = tb(J[(a + 8) >> 2])),
                      (J[(t + 12) >> 2] = u));
                    j = f;
                    k = (g - f) | 0;
                    o = 0;
                    q = (ka - 16) | 0;
                    ka = q;
                    l = J[e >> 2];
                    r = (i - c) >> 2;
                    e: {
                      if (!l | !r) {
                        break e;
                      }
                      k = f ? k : 0;
                      while (1) {
                        m = xc(k >>> 0 < 4 ? (q + 12) | 0 : j, J[l >> 2]);
                        if ((m | 0) == -1) {
                          o = -1;
                          break e;
                        }
                        if (j) {
                          if (k >>> 0 <= 3) {
                            if (k >>> 0 < m >>> 0) {
                              break e;
                            }
                            vb(j, (q + 12) | 0, m);
                          }
                          k = (k - m) | 0;
                          j = (j + m) | 0;
                        } else {
                          j = 0;
                        }
                        if (!J[l >> 2]) {
                          l = 0;
                          break e;
                        }
                        o = (o + m) | 0;
                        l = (l + 4) | 0;
                        r = (r - 1) | 0;
                        if (r) {
                          continue;
                        }
                        break;
                      }
                    }
                    if (j) {
                      J[e >> 2] = l;
                    }
                    ka = (q + 16) | 0;
                    wb((p + 12) | 0);
                    ka = (p + 16) | 0;
                    f: {
                      g: {
                        h: {
                          switch ((o + 1) | 0) {
                            case 0:
                              J[h >> 2] = f;
                              while (1) {
                                if (J[e >> 2] == (c | 0)) {
                                  break g;
                                }
                                b = Rc(f, J[c >> 2], J[(a + 8) >> 2]);
                                if ((b | 0) == -1) {
                                  break g;
                                }
                                f = (b + J[h >> 2]) | 0;
                                J[h >> 2] = f;
                                c = (c + 4) | 0;
                                continue;
                              }
                            case 1:
                              break b;
                            default:
                              break h;
                          }
                        }
                        f = (J[h >> 2] + o) | 0;
                        J[h >> 2] = f;
                        if ((f | 0) == (g | 0)) {
                          break f;
                        }
                        if ((d | 0) == (i | 0)) {
                          c = J[e >> 2];
                          i = d;
                          continue;
                        }
                        c = (n + 4) | 0;
                        i = Rc(c, 0, J[(a + 8) >> 2]);
                        if ((i | 0) == -1) {
                          break c;
                        }
                        if ((g - J[h >> 2]) >>> 0 < i >>> 0) {
                          break b;
                        }
                        while (1) {
                          if (i) {
                            f = K[c | 0];
                            j = J[h >> 2];
                            J[h >> 2] = j + 1;
                            H[j | 0] = f;
                            i = (i - 1) | 0;
                            c = (c + 1) | 0;
                            continue;
                          }
                          break;
                        }
                        c = (J[e >> 2] + 4) | 0;
                        J[e >> 2] = c;
                        i = c;
                        while (1) {
                          if ((d | 0) == (i | 0)) {
                            i = d;
                            break d;
                          }
                          if (!J[i >> 2]) {
                            break d;
                          }
                          i = (i + 4) | 0;
                          continue;
                        }
                      }
                      J[e >> 2] = c;
                      break c;
                    }
                    c = J[e >> 2];
                  }
                  s = (c | 0) != (d | 0);
                  break b;
                }
                f = J[h >> 2];
                continue;
              }
              break;
            }
            s = 2;
          }
          ka = (n + 16) | 0;
          return s | 0;
        }
        function Mj(a) {
          a = a | 0;
          var b = 0,
            c = 0,
            d = 0,
            e = 0,
            f = 0,
            g = 0;
          f = (ka - 16) | 0;
          ka = f;
          a: {
            if (!J[(a + 64) >> 2]) {
              b = -1;
              break a;
            }
            c = J[(a + 92) >> 2] & 8;
            if (!c) {
              J[(a + 28) >> 2] = 0;
              J[(a + 20) >> 2] = 0;
              J[(a + 24) >> 2] = 0;
              b = K[(a + 98) | 0];
              d = J[((b ? 52 : 60) + a) >> 2];
              b = J[((b ? 32 : 56) + a) >> 2];
              J[(a + 92) >> 2] = 8;
              J[(a + 8) >> 2] = b;
              b = (b + d) | 0;
              J[(a + 16) >> 2] = b;
              J[(a + 12) >> 2] = b;
            }
            d = !c;
            b = J[(a + 12) >> 2];
            if (!b) {
              b = (f + 16) | 0;
              J[(a + 16) >> 2] = b;
              J[(a + 12) >> 2] = b;
              J[(a + 8) >> 2] = f + 15;
            }
            c = J[(a + 16) >> 2];
            if (!d) {
              e = (((c - J[(a + 8) >> 2]) | 0) / 2) | 0;
              e = e >>> 0 >= 4 ? 4 : e;
            }
            b: {
              c: {
                d: {
                  if ((b | 0) == (c | 0)) {
                    if (e) {
                      z(J[(a + 8) >> 2], (c - e) | 0, e);
                    }
                    if (K[(a + 98) | 0] == 1) {
                      b = (J[(a + 8) >> 2] + e) | 0;
                      c = Rf(b, (J[(a + 16) >> 2] - b) | 0, J[(a + 64) >> 2]);
                      if (!c) {
                        break c;
                      }
                      b = (J[(a + 8) >> 2] + e) | 0;
                      J[(a + 12) >> 2] = b;
                      J[(a + 16) >> 2] = b + c;
                      b = K[b | 0];
                      break b;
                    }
                    b = J[(a + 40) >> 2];
                    c = J[(a + 36) >> 2];
                    e: {
                      if ((b | 0) == (c | 0)) {
                        c = b;
                        break e;
                      }
                      b = (b - c) | 0;
                      if (b) {
                        z(J[(a + 32) >> 2], c, b);
                      }
                      b = J[(a + 36) >> 2];
                      c = J[(a + 40) >> 2];
                    }
                    d = J[(a + 76) >> 2];
                    J[(a + 80) >> 2] = J[(a + 72) >> 2];
                    J[(a + 84) >> 2] = d;
                    d = J[(a + 32) >> 2];
                    b = (c - b) | 0;
                    c = (d + b) | 0;
                    J[(a + 36) >> 2] = c;
                    g = (d | 0) == ((a + 44) | 0) ? 8 : J[(a + 52) >> 2];
                    J[(a + 40) >> 2] = d + g;
                    d = c;
                    b = (g - b) | 0;
                    c = (J[(a + 60) >> 2] - e) | 0;
                    c = Rf(d, b >>> 0 < c >>> 0 ? b : c, J[(a + 64) >> 2]);
                    if (!c) {
                      break c;
                    }
                    b = J[(a + 68) >> 2];
                    if (!b) {
                      break d;
                    }
                    c = (c + J[(a + 36) >> 2]) | 0;
                    J[(a + 40) >> 2] = c;
                    d = c;
                    c = J[(a + 8) >> 2];
                    if (
                      (oa[J[(J[b >> 2] + 16) >> 2]](
                        b,
                        (a + 72) | 0,
                        J[(a + 32) >> 2],
                        d,
                        (a + 36) | 0,
                        (c + e) | 0,
                        (c + J[(a + 60) >> 2]) | 0,
                        (f + 8) | 0,
                      ) |
                        0) ==
                      3
                    ) {
                      J[(a + 16) >> 2] = J[(a + 40) >> 2];
                      b = J[(a + 32) >> 2];
                      J[(a + 12) >> 2] = b;
                      J[(a + 8) >> 2] = b;
                      b = K[b | 0];
                      break b;
                    }
                    c = J[(f + 8) >> 2];
                    b = (J[(a + 8) >> 2] + e) | 0;
                    if ((c | 0) == (b | 0)) {
                      break c;
                    }
                    J[(a + 16) >> 2] = c;
                    J[(a + 12) >> 2] = b;
                    b = K[b | 0];
                    break b;
                  }
                  b = K[b | 0];
                  break b;
                }
                Oa();
                y();
              }
              b = -1;
            }
            if (J[(a + 8) >> 2] != ((f + 15) | 0)) {
              break a;
            }
            J[(a + 16) >> 2] = 0;
            J[(a + 8) >> 2] = 0;
            J[(a + 12) >> 2] = 0;
          }
          ka = (f + 16) | 0;
          return b | 0;
        }
        function Vi(a, b, c, d, e, f) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          f = f | 0;
          var g = 0,
            h = 0,
            i = 0,
            j = Q(0);
          a = (ka - 272) | 0;
          ka = a;
          J[(a + 264) >> 2] = c;
          J[(a + 268) >> 2] = b;
          _c((a + 208) | 0, d, (a + 224) | 0, (a + 223) | 0, (a + 222) | 0);
          J[(a + 200) >> 2] = 0;
          J[(a + 192) >> 2] = 0;
          J[(a + 196) >> 2] = 0;
          b = (a + 192) | 0;
          Ba(b, 10);
          b = H[(a + 203) | 0] < 0 ? J[(a + 192) >> 2] : b;
          J[(a + 188) >> 2] = b;
          J[(a + 12) >> 2] = a + 16;
          J[(a + 8) >> 2] = 0;
          H[(a + 7) | 0] = 1;
          H[(a + 6) | 0] = 69;
          c = 0;
          while (1) {
            a: {
              b: {
                c: {
                  d: {
                    if (Ma((a + 268) | 0, (a + 264) | 0)) {
                      break d;
                    }
                    d = H[(a + 203) | 0];
                    d = (d | 0) < 0 ? J[(a + 196) >> 2] : d;
                    if (J[(a + 188) >> 2] == ((d + b) | 0)) {
                      b = (a + 192) | 0;
                      Ba(b, d << 1);
                      Ba(
                        b,
                        H[(a + 203) | 0] >= 0
                          ? 10
                          : ((J[(a + 200) >> 2] & 2147483647) - 1) | 0,
                      );
                      b = H[(a + 203) | 0] < 0 ? J[(a + 192) >> 2] : b;
                      J[(a + 188) >> 2] = d + b;
                    }
                    if (
                      Zc(
                        ($a(J[(a + 268) >> 2]) << 24) >> 24,
                        (a + 7) | 0,
                        (a + 6) | 0,
                        b,
                        (a + 188) | 0,
                        H[(a + 223) | 0],
                        H[(a + 222) | 0],
                        (a + 208) | 0,
                        (a + 16) | 0,
                        (a + 12) | 0,
                        (a + 8) | 0,
                        (a + 224) | 0,
                      )
                    ) {
                      break d;
                    }
                    if (c) {
                      break c;
                    }
                    c = 0;
                    g = (J[(a + 188) >> 2] - b) | 0;
                    if ((g | 0) <= 0) {
                      break b;
                    }
                    e: {
                      f: {
                        d = K[b | 0];
                        h = (d - 43) | 0;
                        switch (h | 0) {
                          case 0:
                          case 2:
                            break e;
                          default:
                            break f;
                        }
                      }
                      if ((d | 0) == 46) {
                        break c;
                      }
                      c = 1;
                      if (((d - 48) & 255) >>> 0 < 10) {
                        break b;
                      }
                      break d;
                    }
                    if ((g | 0) == 1) {
                      break b;
                    }
                    g: {
                      switch (h | 0) {
                        case 0:
                        case 2:
                          break g;
                        default:
                          break b;
                      }
                    }
                    d = K[(b + 1) | 0];
                    if ((d | 0) == 46) {
                      break c;
                    }
                    c = 1;
                    if (((d - 48) & 255) >>> 0 <= 9) {
                      break b;
                    }
                  }
                  c = H[(a + 219) | 0];
                  h: {
                    if (
                      !((c | 0) < 0 ? J[(a + 212) >> 2] : c) |
                      !(H[(a + 7) | 0] & 1)
                    ) {
                      break h;
                    }
                    c = J[(a + 12) >> 2];
                    if (((c - ((a + 16) | 0)) | 0) > 159) {
                      break h;
                    }
                    J[(a + 12) >> 2] = c + 4;
                    J[c >> 2] = J[(a + 8) >> 2];
                  }
                  ((i = f), (j = Oe(b, J[(a + 188) >> 2], e)), (N[i >> 2] = j));
                  Va((a + 208) | 0, (a + 16) | 0, J[(a + 12) >> 2], e);
                  if (Ma((a + 268) | 0, (a + 264) | 0)) {
                    J[e >> 2] = J[e >> 2] | 2;
                  }
                  b = J[(a + 268) >> 2];
                  ya((a + 192) | 0);
                  ya((a + 208) | 0);
                  ka = (a + 272) | 0;
                  break a;
                }
                c = 1;
              }
              db(J[(a + 268) >> 2]);
              continue;
            }
            break;
          }
          return b | 0;
        }
        function Ti(a, b, c, d, e, f) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          f = f | 0;
          var g = 0,
            h = 0,
            i = 0,
            j = 0;
          a = (ka - 272) | 0;
          ka = a;
          J[(a + 264) >> 2] = c;
          J[(a + 268) >> 2] = b;
          _c((a + 208) | 0, d, (a + 224) | 0, (a + 223) | 0, (a + 222) | 0);
          J[(a + 200) >> 2] = 0;
          J[(a + 192) >> 2] = 0;
          J[(a + 196) >> 2] = 0;
          b = (a + 192) | 0;
          Ba(b, 10);
          b = H[(a + 203) | 0] < 0 ? J[(a + 192) >> 2] : b;
          J[(a + 188) >> 2] = b;
          J[(a + 12) >> 2] = a + 16;
          J[(a + 8) >> 2] = 0;
          H[(a + 7) | 0] = 1;
          H[(a + 6) | 0] = 69;
          c = 0;
          while (1) {
            a: {
              b: {
                c: {
                  d: {
                    if (Ma((a + 268) | 0, (a + 264) | 0)) {
                      break d;
                    }
                    d = H[(a + 203) | 0];
                    d = (d | 0) < 0 ? J[(a + 196) >> 2] : d;
                    if (J[(a + 188) >> 2] == ((d + b) | 0)) {
                      b = (a + 192) | 0;
                      Ba(b, d << 1);
                      Ba(
                        b,
                        H[(a + 203) | 0] >= 0
                          ? 10
                          : ((J[(a + 200) >> 2] & 2147483647) - 1) | 0,
                      );
                      b = H[(a + 203) | 0] < 0 ? J[(a + 192) >> 2] : b;
                      J[(a + 188) >> 2] = d + b;
                    }
                    if (
                      Zc(
                        ($a(J[(a + 268) >> 2]) << 24) >> 24,
                        (a + 7) | 0,
                        (a + 6) | 0,
                        b,
                        (a + 188) | 0,
                        H[(a + 223) | 0],
                        H[(a + 222) | 0],
                        (a + 208) | 0,
                        (a + 16) | 0,
                        (a + 12) | 0,
                        (a + 8) | 0,
                        (a + 224) | 0,
                      )
                    ) {
                      break d;
                    }
                    if (c) {
                      break c;
                    }
                    c = 0;
                    g = (J[(a + 188) >> 2] - b) | 0;
                    if ((g | 0) <= 0) {
                      break b;
                    }
                    e: {
                      f: {
                        d = K[b | 0];
                        h = (d - 43) | 0;
                        switch (h | 0) {
                          case 0:
                          case 2:
                            break e;
                          default:
                            break f;
                        }
                      }
                      if ((d | 0) == 46) {
                        break c;
                      }
                      c = 1;
                      if (((d - 48) & 255) >>> 0 < 10) {
                        break b;
                      }
                      break d;
                    }
                    if ((g | 0) == 1) {
                      break b;
                    }
                    g: {
                      switch (h | 0) {
                        case 0:
                        case 2:
                          break g;
                        default:
                          break b;
                      }
                    }
                    d = K[(b + 1) | 0];
                    if ((d | 0) == 46) {
                      break c;
                    }
                    c = 1;
                    if (((d - 48) & 255) >>> 0 <= 9) {
                      break b;
                    }
                  }
                  c = H[(a + 219) | 0];
                  h: {
                    if (
                      !((c | 0) < 0 ? J[(a + 212) >> 2] : c) |
                      !(H[(a + 7) | 0] & 1)
                    ) {
                      break h;
                    }
                    c = J[(a + 12) >> 2];
                    if (((c - ((a + 16) | 0)) | 0) > 159) {
                      break h;
                    }
                    J[(a + 12) >> 2] = c + 4;
                    J[c >> 2] = J[(a + 8) >> 2];
                  }
                  ((i = f), (j = Ne(b, J[(a + 188) >> 2], e)), (O[i >> 3] = j));
                  Va((a + 208) | 0, (a + 16) | 0, J[(a + 12) >> 2], e);
                  if (Ma((a + 268) | 0, (a + 264) | 0)) {
                    J[e >> 2] = J[e >> 2] | 2;
                  }
                  b = J[(a + 268) >> 2];
                  ya((a + 192) | 0);
                  ya((a + 208) | 0);
                  ka = (a + 272) | 0;
                  break a;
                }
                c = 1;
              }
              db(J[(a + 268) >> 2]);
              continue;
            }
            break;
          }
          return b | 0;
        }
        function Ki(a, b, c, d, e, f) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          f = f | 0;
          var g = 0,
            h = 0,
            i = 0,
            j = Q(0);
          a = (ka - 352) | 0;
          ka = a;
          J[(a + 344) >> 2] = c;
          J[(a + 348) >> 2] = b;
          Xc((a + 204) | 0, d, (a + 224) | 0, (a + 220) | 0, (a + 216) | 0);
          J[(a + 200) >> 2] = 0;
          J[(a + 192) >> 2] = 0;
          J[(a + 196) >> 2] = 0;
          b = (a + 192) | 0;
          Ba(b, 10);
          b = H[(a + 203) | 0] < 0 ? J[(a + 192) >> 2] : b;
          J[(a + 188) >> 2] = b;
          J[(a + 12) >> 2] = a + 16;
          J[(a + 8) >> 2] = 0;
          H[(a + 7) | 0] = 1;
          H[(a + 6) | 0] = 69;
          c = 0;
          while (1) {
            a: {
              b: {
                c: {
                  d: {
                    if (La((a + 348) | 0, (a + 344) | 0)) {
                      break d;
                    }
                    d = H[(a + 203) | 0];
                    d = (d | 0) < 0 ? J[(a + 196) >> 2] : d;
                    if (J[(a + 188) >> 2] == ((d + b) | 0)) {
                      b = (a + 192) | 0;
                      Ba(b, d << 1);
                      Ba(
                        b,
                        H[(a + 203) | 0] >= 0
                          ? 10
                          : ((J[(a + 200) >> 2] & 2147483647) - 1) | 0,
                      );
                      b = H[(a + 203) | 0] < 0 ? J[(a + 192) >> 2] : b;
                      J[(a + 188) >> 2] = d + b;
                    }
                    if (
                      Wc(
                        _a(J[(a + 348) >> 2]),
                        (a + 7) | 0,
                        (a + 6) | 0,
                        b,
                        (a + 188) | 0,
                        J[(a + 220) >> 2],
                        J[(a + 216) >> 2],
                        (a + 204) | 0,
                        (a + 16) | 0,
                        (a + 12) | 0,
                        (a + 8) | 0,
                        (a + 224) | 0,
                      )
                    ) {
                      break d;
                    }
                    if (c) {
                      break c;
                    }
                    c = 0;
                    g = (J[(a + 188) >> 2] - b) | 0;
                    if ((g | 0) <= 0) {
                      break b;
                    }
                    e: {
                      f: {
                        d = K[b | 0];
                        h = (d - 43) | 0;
                        switch (h | 0) {
                          case 0:
                          case 2:
                            break e;
                          default:
                            break f;
                        }
                      }
                      if ((d | 0) == 46) {
                        break c;
                      }
                      c = 1;
                      if (((d - 48) & 255) >>> 0 < 10) {
                        break b;
                      }
                      break d;
                    }
                    if ((g | 0) == 1) {
                      break b;
                    }
                    g: {
                      switch (h | 0) {
                        case 0:
                        case 2:
                          break g;
                        default:
                          break b;
                      }
                    }
                    d = K[(b + 1) | 0];
                    if ((d | 0) == 46) {
                      break c;
                    }
                    c = 1;
                    if (((d - 48) & 255) >>> 0 <= 9) {
                      break b;
                    }
                  }
                  c = H[(a + 215) | 0];
                  h: {
                    if (
                      !((c | 0) < 0 ? J[(a + 208) >> 2] : c) |
                      !(H[(a + 7) | 0] & 1)
                    ) {
                      break h;
                    }
                    c = J[(a + 12) >> 2];
                    if (((c - ((a + 16) | 0)) | 0) > 159) {
                      break h;
                    }
                    J[(a + 12) >> 2] = c + 4;
                    J[c >> 2] = J[(a + 8) >> 2];
                  }
                  ((i = f), (j = Oe(b, J[(a + 188) >> 2], e)), (N[i >> 2] = j));
                  Va((a + 204) | 0, (a + 16) | 0, J[(a + 12) >> 2], e);
                  if (La((a + 348) | 0, (a + 344) | 0)) {
                    J[e >> 2] = J[e >> 2] | 2;
                  }
                  b = J[(a + 348) >> 2];
                  ya((a + 192) | 0);
                  ya((a + 204) | 0);
                  ka = (a + 352) | 0;
                  break a;
                }
                c = 1;
              }
              cb(J[(a + 348) >> 2]);
              continue;
            }
            break;
          }
          return b | 0;
        }
        function Ji(a, b, c, d, e, f) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          f = f | 0;
          var g = 0,
            h = 0,
            i = 0,
            j = 0;
          a = (ka - 352) | 0;
          ka = a;
          J[(a + 344) >> 2] = c;
          J[(a + 348) >> 2] = b;
          Xc((a + 204) | 0, d, (a + 224) | 0, (a + 220) | 0, (a + 216) | 0);
          J[(a + 200) >> 2] = 0;
          J[(a + 192) >> 2] = 0;
          J[(a + 196) >> 2] = 0;
          b = (a + 192) | 0;
          Ba(b, 10);
          b = H[(a + 203) | 0] < 0 ? J[(a + 192) >> 2] : b;
          J[(a + 188) >> 2] = b;
          J[(a + 12) >> 2] = a + 16;
          J[(a + 8) >> 2] = 0;
          H[(a + 7) | 0] = 1;
          H[(a + 6) | 0] = 69;
          c = 0;
          while (1) {
            a: {
              b: {
                c: {
                  d: {
                    if (La((a + 348) | 0, (a + 344) | 0)) {
                      break d;
                    }
                    d = H[(a + 203) | 0];
                    d = (d | 0) < 0 ? J[(a + 196) >> 2] : d;
                    if (J[(a + 188) >> 2] == ((d + b) | 0)) {
                      b = (a + 192) | 0;
                      Ba(b, d << 1);
                      Ba(
                        b,
                        H[(a + 203) | 0] >= 0
                          ? 10
                          : ((J[(a + 200) >> 2] & 2147483647) - 1) | 0,
                      );
                      b = H[(a + 203) | 0] < 0 ? J[(a + 192) >> 2] : b;
                      J[(a + 188) >> 2] = d + b;
                    }
                    if (
                      Wc(
                        _a(J[(a + 348) >> 2]),
                        (a + 7) | 0,
                        (a + 6) | 0,
                        b,
                        (a + 188) | 0,
                        J[(a + 220) >> 2],
                        J[(a + 216) >> 2],
                        (a + 204) | 0,
                        (a + 16) | 0,
                        (a + 12) | 0,
                        (a + 8) | 0,
                        (a + 224) | 0,
                      )
                    ) {
                      break d;
                    }
                    if (c) {
                      break c;
                    }
                    c = 0;
                    g = (J[(a + 188) >> 2] - b) | 0;
                    if ((g | 0) <= 0) {
                      break b;
                    }
                    e: {
                      f: {
                        d = K[b | 0];
                        h = (d - 43) | 0;
                        switch (h | 0) {
                          case 0:
                          case 2:
                            break e;
                          default:
                            break f;
                        }
                      }
                      if ((d | 0) == 46) {
                        break c;
                      }
                      c = 1;
                      if (((d - 48) & 255) >>> 0 < 10) {
                        break b;
                      }
                      break d;
                    }
                    if ((g | 0) == 1) {
                      break b;
                    }
                    g: {
                      switch (h | 0) {
                        case 0:
                        case 2:
                          break g;
                        default:
                          break b;
                      }
                    }
                    d = K[(b + 1) | 0];
                    if ((d | 0) == 46) {
                      break c;
                    }
                    c = 1;
                    if (((d - 48) & 255) >>> 0 <= 9) {
                      break b;
                    }
                  }
                  c = H[(a + 215) | 0];
                  h: {
                    if (
                      !((c | 0) < 0 ? J[(a + 208) >> 2] : c) |
                      !(H[(a + 7) | 0] & 1)
                    ) {
                      break h;
                    }
                    c = J[(a + 12) >> 2];
                    if (((c - ((a + 16) | 0)) | 0) > 159) {
                      break h;
                    }
                    J[(a + 12) >> 2] = c + 4;
                    J[c >> 2] = J[(a + 8) >> 2];
                  }
                  ((i = f), (j = Ne(b, J[(a + 188) >> 2], e)), (O[i >> 3] = j));
                  Va((a + 204) | 0, (a + 16) | 0, J[(a + 12) >> 2], e);
                  if (La((a + 348) | 0, (a + 344) | 0)) {
                    J[e >> 2] = J[e >> 2] | 2;
                  }
                  b = J[(a + 348) >> 2];
                  ya((a + 192) | 0);
                  ya((a + 204) | 0);
                  ka = (a + 352) | 0;
                  break a;
                }
                c = 1;
              }
              cb(J[(a + 348) >> 2]);
              continue;
            }
            break;
          }
          return b | 0;
        }
        function de(a, b, c, d, e, f, g, h) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          f = f | 0;
          g = g | 0;
          h = h | 0;
          var i = 0,
            j = 0,
            k = 0,
            l = 0,
            m = 0;
          a = (ka - 16) | 0;
          ka = a;
          J[(a + 12) >> 2] = c;
          J[(a + 8) >> 2] = f;
          a: {
            b: {
              c: {
                while (1) {
                  if (!((c >>> 0 >= d >>> 0) | (f >>> 0 >= g >>> 0))) {
                    b = 2;
                    m = c;
                    j = K[c | 0];
                    d: {
                      if ((j << 24) >> 24 >= 0) {
                        I[f >> 1] = j;
                        b = 1;
                        break d;
                      }
                      if (j >>> 0 < 194) {
                        break b;
                      }
                      if (j >>> 0 <= 223) {
                        i = 1;
                        if (((d - c) | 0) < 2) {
                          break a;
                        }
                        i = K[(c + 1) | 0];
                        if ((i & 192) != 128) {
                          break c;
                        }
                        I[f >> 1] = (i & 63) | ((j << 6) & 1984);
                        b = 2;
                        break d;
                      }
                      if (j >>> 0 <= 239) {
                        b = 1;
                        k = (d - c) | 0;
                        if ((k | 0) < 2) {
                          break c;
                        }
                        i = H[(c + 1) | 0];
                        e: {
                          f: {
                            if ((j | 0) != 237) {
                              if ((j | 0) != 224) {
                                break f;
                              }
                              if ((i & -32) != -96) {
                                break b;
                              }
                              break e;
                            }
                            if ((i | 0) >= -96) {
                              break b;
                            }
                            break e;
                          }
                          if ((i | 0) > -65) {
                            break b;
                          }
                        }
                        if ((k | 0) == 2) {
                          break c;
                        }
                        b = K[(c + 2) | 0];
                        if ((b & 192) != 128) {
                          break b;
                        }
                        I[f >> 1] = (b & 63) | (((i & 63) << 6) | (j << 12));
                        b = 3;
                        break d;
                      }
                      if (j >>> 0 > 244) {
                        break b;
                      }
                      b = 1;
                      k = (d - c) | 0;
                      if ((k | 0) < 2) {
                        break c;
                      }
                      l = K[(c + 1) | 0];
                      i = (l << 24) >> 24;
                      g: {
                        h: {
                          switch ((j - 240) | 0) {
                            case 0:
                              if (((i + 112) & 255) >>> 0 >= 48) {
                                break b;
                              }
                              break g;
                            case 4:
                              if ((i | 0) >= -112) {
                                break b;
                              }
                              break g;
                            default:
                              break h;
                          }
                        }
                        if ((i | 0) > -65) {
                          break b;
                        }
                      }
                      if ((k | 0) == 2) {
                        break c;
                      }
                      i = K[(c + 2) | 0];
                      if ((i & 192) != 128) {
                        break b;
                      }
                      if ((k | 0) == 3) {
                        break c;
                      }
                      k = K[(c + 3) | 0];
                      if ((k & 192) != 128) {
                        break b;
                      }
                      if (((g - f) | 0) < 3) {
                        break c;
                      }
                      b = 2;
                      k = k & 63;
                      c = i << 6;
                      j = j & 7;
                      if (
                        (k |
                          ((c & 4032) | (((l << 12) & 258048) | (j << 18)))) >>>
                          0 >
                        1114111
                      ) {
                        break c;
                      }
                      I[(f + 2) >> 1] = k | (c & 960) | 56320;
                      b = l << 2;
                      I[f >> 1] =
                        ((((i >>> 4) & 3) | ((b & 192) | (j << 8) | (b & 60))) +
                          16320) |
                        55296;
                      f = (f + 2) | 0;
                      b = 4;
                    }
                    c = (m + b) | 0;
                    J[(a + 12) >> 2] = c;
                    f = (f + 2) | 0;
                    J[(a + 8) >> 2] = f;
                    continue;
                  }
                  break;
                }
                b = c >>> 0 < d >>> 0;
              }
              i = b;
              break a;
            }
            i = 2;
          }
          J[e >> 2] = J[(a + 12) >> 2];
          J[h >> 2] = J[(a + 8) >> 2];
          ka = (a + 16) | 0;
          return i | 0;
        }
        function ak() {
          var a = 0,
            b = 0,
            c = 0,
            d = 0,
            e = 0;
          if (!K[20594]) {
            d = J[1359];
            J[4891] = 0;
            J[4892] = 0;
            b = (ka - 16) | 0;
            ka = b;
            a = rd(19508);
            H[(a + 52) | 0] = 0;
            J[(a + 48) >> 2] = -1;
            J[(a + 40) >> 2] = 19564;
            J[(a + 32) >> 2] = d;
            J[a >> 2] = 5780;
            c = Db((b + 12) | 0, (a + 4) | 0);
            oa[J[(J[a >> 2] + 8) >> 2]](a, c);
            fb(c);
            ka = (b + 16) | 0;
            J[4863] = 0;
            J[4855] = 0;
            J[4856] = 4400;
            J[4854] = 4380;
            ac((J[1092] + 19416) | 0, a);
            e = J[1360];
            jd(19572, e);
            b = J[1361];
            jd(19716, b);
            jd(19860, b);
            J[(J[(J[4854] - 12) >> 2] + 19488) >> 2] = 19572;
            a = (J[4929] - 12) | 0;
            c = (J[a >> 2] + 19720) | 0;
            J[c >> 2] = J[c >> 2] | 8192;
            J[(J[a >> 2] + 19788) >> 2] = 19572;
            J[5038] = 0;
            J[5039] = 0;
            c = (ka - 16) | 0;
            ka = c;
            a = Ef(20096);
            H[(a + 52) | 0] = 0;
            J[(a + 48) >> 2] = -1;
            J[(a + 40) >> 2] = 20152;
            J[(a + 32) >> 2] = d;
            J[a >> 2] = 5984;
            d = Db((c + 12) | 0, (a + 4) | 0);
            oa[J[(J[a >> 2] + 8) >> 2]](a, d);
            fb(d);
            ka = (c + 16) | 0;
            J[5010] = 0;
            J[5002] = 0;
            J[5003] = 4544;
            J[5001] = 4524;
            ac((J[1128] + 20004) | 0, a);
            id(20160, e);
            id(20304, b);
            id(20448, b);
            J[(J[(J[5001] - 12) >> 2] + 20076) >> 2] = 20160;
            a = (J[5076] - 12) | 0;
            b = (J[a >> 2] + 20308) | 0;
            J[b >> 2] = J[b >> 2] | 8192;
            J[(J[a >> 2] + 20376) >> 2] = 20160;
            H[20594] = 1;
          }
          a = (ka - 16) | 0;
          ka = a;
          a: {
            if (ca((a + 12) | 0, (a + 8) | 0) | 0) {
              break a;
            }
            b = Wa(((J[(a + 12) >> 2] << 2) + 4) | 0);
            J[5149] = b;
            if (!b) {
              break a;
            }
            b = Wa(J[(a + 8) >> 2]);
            if (b) {
              d = J[5149];
              J[(d + (J[(a + 12) >> 2] << 2)) >> 2] = 0;
              if (!(ia(d | 0, b | 0) | 0)) {
                break a;
              }
            }
            J[5149] = 0;
          }
          ka = (a + 16) | 0;
          a = of(16560);
          J[(a + 64) >> 2] = 6;
          J[(a + 56) >> 2] = 5;
          J[(a + 60) >> 2] = 0;
          J[(a + 48) >> 2] = 4;
          J[(a + 52) >> 2] = 1;
          J[(a + 40) >> 2] = 3;
          J[(a + 44) >> 2] = 2;
          J[(a + 32) >> 2] = 0;
          J[(a + 36) >> 2] = 0;
          J[(a + 20) >> 2] = 6;
          J[(a + 24) >> 2] = -1;
          J[(a + 12) >> 2] = 0;
          J[(a + 16) >> 2] = 7;
          J[4844] = 17164;
          J[4834] = 65536;
          J[4833] = 88256;
          J[4826] = 42;
          J[4835] = J[4133];
        }
        function Gg(a, b, c) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          var d = 0,
            e = 0,
            f = 0,
            g = 0,
            h = 0;
          e = (ka - 80) | 0;
          ka = e;
          a: {
            d = 1;
            b: {
              if (J[(a + 4) >> 2] == J[(b + 4) >> 2]) {
                break b;
              }
              d = (ka + -64) | 0;
              ka = d;
              f = J[b >> 2];
              h = J[(f - 8) >> 2];
              g = (h + b) | 0;
              f = J[(f - 4) >> 2];
              c: {
                if (J[(f + 4) >> 2] == J[3894]) {
                  b = h ? 0 : g;
                  break c;
                }
                if ((b | 0) >= (g | 0)) {
                  J[(d + 20) >> 2] = 0;
                  J[(d + 24) >> 2] = 0;
                  J[(d + 16) >> 2] = 0;
                  J[(d + 12) >> 2] = 15572;
                  J[(d + 8) >> 2] = b;
                  J[(d + 4) >> 2] = f;
                  J[(d + 28) >> 2] = 0;
                  J[(d + 32) >> 2] = 0;
                  J[(d + 36) >> 2] = 0;
                  J[(d + 40) >> 2] = 0;
                  J[(d + 44) >> 2] = 0;
                  J[(d + 48) >> 2] = 0;
                  J[(d + 60) >> 2] = 0;
                  J[(d + 52) >> 2] = 1;
                  J[(d + 56) >> 2] = 16777216;
                  oa[J[(J[f >> 2] + 20) >> 2]](f, (d + 4) | 0, g, g, 1, 0);
                  if (J[(d + 28) >> 2]) {
                    break c;
                  }
                }
                J[(d + 20) >> 2] = 0;
                J[(d + 24) >> 2] = 0;
                J[(d + 16) >> 2] = 0;
                J[(d + 12) >> 2] = 15524;
                J[(d + 8) >> 2] = b;
                J[(d + 4) >> 2] = 15572;
                J[(d + 28) >> 2] = 0;
                J[(d + 32) >> 2] = 0;
                J[(d + 36) >> 2] = 0;
                J[(d + 40) >> 2] = 0;
                J[(d + 44) >> 2] = 0;
                J[(d + 48) >> 2] = 0;
                H[(d + 51) | 0] = 0;
                H[(d + 52) | 0] = 0;
                H[(d + 53) | 0] = 0;
                H[(d + 54) | 0] = 0;
                H[(d + 55) | 0] = 0;
                H[(d + 56) | 0] = 0;
                H[(d + 57) | 0] = 0;
                H[(d + 58) | 0] = 0;
                J[(d + 60) >> 2] = 0;
                H[(d + 59) | 0] = 1;
                oa[J[(J[f >> 2] + 24) >> 2]](f, (d + 4) | 0, g, 1, 0);
                b = 0;
                d: {
                  switch (J[(d + 40) >> 2]) {
                    case 0:
                      b =
                        J[(d + 44) >> 2] == 1
                          ? J[(d + 32) >> 2] == 1
                            ? J[(d + 36) >> 2] == 1
                              ? J[(d + 24) >> 2]
                              : 0
                            : 0
                          : 0;
                      break c;
                    case 1:
                      break d;
                    default:
                      break c;
                  }
                }
                if (J[(d + 28) >> 2] != 1) {
                  if (
                    J[(d + 44) >> 2] |
                    (J[(d + 32) >> 2] != 1) |
                    (J[(d + 36) >> 2] != 1)
                  ) {
                    break c;
                  }
                }
                b = J[(d + 20) >> 2];
              }
              ka = (d - -64) | 0;
              d = 0;
              if (!b) {
                break b;
              }
              d = J[c >> 2];
              if (!d) {
                break a;
              }
              D((e + 24) | 0, 0, 56);
              H[(e + 75) | 0] = 1;
              J[(e + 32) >> 2] = -1;
              J[(e + 28) >> 2] = a;
              J[(e + 20) >> 2] = b;
              J[(e + 68) >> 2] = 1;
              oa[J[(J[b >> 2] + 28) >> 2]](b, (e + 20) | 0, d, 1);
              a = J[(e + 44) >> 2];
              if ((a | 0) == 1) {
                J[c >> 2] = J[(e + 36) >> 2];
              }
              d = (a | 0) == 1;
            }
            ka = (e + 80) | 0;
            return d | 0;
          }
          J[(e + 8) >> 2] = 1958;
          J[(e + 4) >> 2] = 487;
          J[e >> 2] = 1580;
          ud();
          y();
        }
        function Ja(a, b) {
          var c = 0,
            d = 0,
            e = 0,
            f = 0,
            g = 0,
            h = 0;
          f = (ka - 16) | 0;
          ka = f;
          J[(a + 4) >> 2] = J[(a + 4) >> 2] + 1;
          J[(f + 12) >> 2] = a;
          a = J[5248];
          if (((J[5249] - a) >> 2) >>> 0 <= b >>> 0) {
            a = (b + 1) | 0;
            d = J[5248];
            c = (J[5249] - d) >> 2;
            a: {
              if (a >>> 0 > c >>> 0) {
                h = (ka - 32) | 0;
                ka = h;
                d = (a - c) | 0;
                e = J[5249];
                b: {
                  if (d >>> 0 <= ((J[5250] - e) >> 2) >>> 0) {
                    pe(d);
                    break b;
                  }
                  a = (d + ((e - J[5248]) >> 2)) | 0;
                  if (a >>> 0 >= 1073741824) {
                    Oa();
                    y();
                  }
                  c = (J[5250] - J[5248]) | 0;
                  e = c >> 1;
                  e =
                    c >>> 0 >= 2147483644
                      ? 1073741823
                      : a >>> 0 < e >>> 0
                        ? e
                        : a;
                  g = (J[5249] - J[5248]) >> 2;
                  c = 0;
                  a = (h + 12) | 0;
                  J[(a + 16) >> 2] = 21004;
                  J[(a + 12) >> 2] = 0;
                  if (e) {
                    c = Wd(e);
                  }
                  J[a >> 2] = c;
                  g = ((g << 2) + c) | 0;
                  J[(a + 8) >> 2] = g;
                  J[(a + 12) >> 2] = (e << 2) + c;
                  J[(a + 4) >> 2] = g;
                  c = J[(a + 8) >> 2];
                  d = (c + (d << 2)) | 0;
                  while (1) {
                    if ((c | 0) != (d | 0)) {
                      J[c >> 2] = 0;
                      c = (c + 4) | 0;
                      continue;
                    }
                    break;
                  }
                  J[(a + 8) >> 2] = d;
                  e = J[5248];
                  c = (J[5249] - e) | 0;
                  d = (J[(a + 4) >> 2] - c) | 0;
                  if (c) {
                    z(d, e, c);
                  }
                  J[(a + 4) >> 2] = d;
                  c = J[5248];
                  J[5249] = c;
                  J[5248] = J[(a + 4) >> 2];
                  J[(a + 4) >> 2] = c;
                  c = J[5249];
                  J[5249] = J[(a + 8) >> 2];
                  J[(a + 8) >> 2] = c;
                  c = J[5250];
                  J[5250] = J[(a + 12) >> 2];
                  J[(a + 12) >> 2] = c;
                  J[a >> 2] = J[(a + 4) >> 2];
                  d = J[(a + 4) >> 2];
                  c = J[(a + 8) >> 2];
                  while (1) {
                    if ((c | 0) != (d | 0)) {
                      c = (c - 4) | 0;
                      J[(a + 8) >> 2] = c;
                      continue;
                    }
                    break;
                  }
                  c = J[a >> 2];
                  if (c) {
                    Vd(J[(a + 16) >> 2], c);
                  }
                }
                ka = (h + 32) | 0;
                break a;
              }
              if (a >>> 0 < c >>> 0) {
                J[5249] = d + (a << 2);
              }
            }
            a = J[5248];
          }
          a = J[((b << 2) + a) >> 2];
          c: {
            if (!a) {
              break c;
            }
            c = J[(a + 4) >> 2];
            J[(a + 4) >> 2] = c - 1;
            if (c) {
              break c;
            }
            oa[J[(J[a >> 2] + 8) >> 2]](a);
          }
          a = J[(f + 12) >> 2];
          J[(f + 12) >> 2] = 0;
          J[(J[5248] + (b << 2)) >> 2] = a;
          a = J[(f + 12) >> 2];
          J[(f + 12) >> 2] = 0;
          d: {
            if (!a) {
              break d;
            }
            b = J[(a + 4) >> 2];
            J[(a + 4) >> 2] = b - 1;
            if (b) {
              break d;
            }
            oa[J[(J[a >> 2] + 8) >> 2]](a);
          }
          ka = (f + 16) | 0;
        }
        function ee(a, b, c, d, e, f, g, h) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          f = f | 0;
          g = g | 0;
          h = h | 0;
          var i = 0,
            j = 0;
          a = (ka - 16) | 0;
          ka = a;
          J[(a + 12) >> 2] = c;
          J[(a + 8) >> 2] = f;
          a: {
            b: {
              while (1) {
                if (c >>> 0 >= d >>> 0) {
                  f = 0;
                  break a;
                }
                f = 2;
                c: {
                  b = L[c >> 1];
                  d: {
                    if (b >>> 0 <= 127) {
                      f = 1;
                      c = J[(a + 8) >> 2];
                      if (((g - c) | 0) <= 0) {
                        break a;
                      }
                      J[(a + 8) >> 2] = c + 1;
                      H[c | 0] = b;
                      break d;
                    }
                    if (b >>> 0 <= 2047) {
                      c = J[(a + 8) >> 2];
                      if (((g - c) | 0) < 2) {
                        break b;
                      }
                      J[(a + 8) >> 2] = c + 1;
                      H[c | 0] = (b >>> 6) | 192;
                      c = J[(a + 8) >> 2];
                      J[(a + 8) >> 2] = c + 1;
                      H[c | 0] = (b & 63) | 128;
                      break d;
                    }
                    if (b >>> 0 <= 55295) {
                      c = J[(a + 8) >> 2];
                      if (((g - c) | 0) < 3) {
                        break b;
                      }
                      J[(a + 8) >> 2] = c + 1;
                      H[c | 0] = (b >>> 12) | 224;
                      c = J[(a + 8) >> 2];
                      J[(a + 8) >> 2] = c + 1;
                      H[c | 0] = ((b >>> 6) & 63) | 128;
                      c = J[(a + 8) >> 2];
                      J[(a + 8) >> 2] = c + 1;
                      H[c | 0] = (b & 63) | 128;
                      break d;
                    }
                    if (b >>> 0 <= 56319) {
                      f = 1;
                      if (((d - c) | 0) < 3) {
                        break a;
                      }
                      i = L[(c + 2) >> 1];
                      if ((i & 64512) != 56320) {
                        break c;
                      }
                      j = J[(a + 8) >> 2];
                      if (((g - j) | 0) < 4) {
                        break a;
                      }
                      f = b & 960;
                      if (
                        ((i & 1023) | (((b << 10) & 64512) | (f << 10))) >>> 0 >
                        1048575
                      ) {
                        break c;
                      }
                      J[(a + 12) >> 2] = c + 2;
                      J[(a + 8) >> 2] = j + 1;
                      c = (((f >>> 6) | 0) + 1) | 0;
                      H[j | 0] = (c >>> 2) | 240;
                      f = J[(a + 8) >> 2];
                      J[(a + 8) >> 2] = f + 1;
                      H[f | 0] = ((c << 4) & 48) | ((b >>> 2) & 15) | 128;
                      c = J[(a + 8) >> 2];
                      J[(a + 8) >> 2] = c + 1;
                      H[c | 0] = ((i >>> 6) & 15) | ((b << 4) & 48) | 128;
                      b = J[(a + 8) >> 2];
                      J[(a + 8) >> 2] = b + 1;
                      H[b | 0] = (i & 63) | 128;
                      break d;
                    }
                    if (b >>> 0 < 57344) {
                      break a;
                    }
                    c = J[(a + 8) >> 2];
                    if (((g - c) | 0) < 3) {
                      break b;
                    }
                    J[(a + 8) >> 2] = c + 1;
                    H[c | 0] = (b >>> 12) | 224;
                    c = J[(a + 8) >> 2];
                    J[(a + 8) >> 2] = c + 1;
                    H[c | 0] = (b >>> 6) & 191;
                    c = J[(a + 8) >> 2];
                    J[(a + 8) >> 2] = c + 1;
                    H[c | 0] = (b & 63) | 128;
                  }
                  c = (J[(a + 12) >> 2] + 2) | 0;
                  J[(a + 12) >> 2] = c;
                  continue;
                }
                break;
              }
              f = 2;
              break a;
            }
            f = 1;
          }
          J[e >> 2] = J[(a + 12) >> 2];
          J[h >> 2] = J[(a + 8) >> 2];
          ka = (a + 16) | 0;
          return f | 0;
        }
        function $e(a, b) {
          var c = 0,
            d = 0,
            e = 0,
            f = 0,
            g = 0;
          a: {
            b: {
              c: {
                d: {
                  e: {
                    c = J[(a + 4) >> 2];
                    f: {
                      if ((c | 0) != J[(a + 104) >> 2]) {
                        J[(a + 4) >> 2] = c + 1;
                        c = K[c | 0];
                        break f;
                      }
                      c = Ca(a);
                    }
                    switch ((c - 43) | 0) {
                      case 0:
                      case 2:
                        break e;
                      default:
                        break d;
                    }
                  }
                  d = (c | 0) == 45;
                  g = !b;
                  c = J[(a + 4) >> 2];
                  g: {
                    if ((c | 0) != J[(a + 104) >> 2]) {
                      J[(a + 4) >> 2] = c + 1;
                      c = K[c | 0];
                      break g;
                    }
                    c = Ca(a);
                  }
                  b = (c - 58) | 0;
                  if (g | (b >>> 0 > 4294967285)) {
                    break c;
                  }
                  if (J[(a + 116) >> 2] < 0) {
                    break b;
                  }
                  J[(a + 4) >> 2] = J[(a + 4) >> 2] - 1;
                  break b;
                }
                b = (c - 58) | 0;
              }
              if (b >>> 0 < 4294967286) {
                break b;
              }
              g = d;
              h: {
                if ((c - 48) >>> 0 >= 10) {
                  break h;
                }
                while (1) {
                  e = (((P(e, 10) + c) | 0) - 48) | 0;
                  d = (e | 0) < 214748364;
                  c = J[(a + 4) >> 2];
                  i: {
                    if ((c | 0) != J[(a + 104) >> 2]) {
                      J[(a + 4) >> 2] = c + 1;
                      c = K[c | 0];
                      break i;
                    }
                    c = Ca(a);
                  }
                  b = (c - 48) | 0;
                  if (d & (b >>> 0 <= 9)) {
                    continue;
                  }
                  break;
                }
                f = e >> 31;
                if (b >>> 0 >= 10) {
                  break h;
                }
                while (1) {
                  b = c;
                  c = dk(e, f, 10, 0);
                  d = (b + c) | 0;
                  b = na;
                  e = (d - 48) | 0;
                  d =
                    ((c >>> 0 > d >>> 0 ? (b + 1) | 0 : b) - (d >>> 0 < 48)) |
                    0;
                  f = d;
                  d =
                    ((e >>> 0 < 2061584302) & ((d | 0) <= 21474836)) |
                    ((d | 0) < 21474836);
                  c = J[(a + 4) >> 2];
                  j: {
                    if ((c | 0) != J[(a + 104) >> 2]) {
                      J[(a + 4) >> 2] = c + 1;
                      c = K[c | 0];
                      break j;
                    }
                    c = Ca(a);
                  }
                  b = (c - 48) | 0;
                  if (d & (b >>> 0 <= 9)) {
                    continue;
                  }
                  break;
                }
                if (b >>> 0 >= 10) {
                  break h;
                }
                while (1) {
                  b = J[(a + 4) >> 2];
                  k: {
                    if ((b | 0) != J[(a + 104) >> 2]) {
                      J[(a + 4) >> 2] = b + 1;
                      b = K[b | 0];
                      break k;
                    }
                    b = Ca(a);
                  }
                  if ((b - 48) >>> 0 < 10) {
                    continue;
                  }
                  break;
                }
              }
              b = J[(a + 116) >> 2];
              if ((b | 0) > 0) {
                b = 1;
              } else {
                b = (b | 0) >= 0;
              }
              if (b) {
                J[(a + 4) >> 2] = J[(a + 4) >> 2] - 1;
              }
              a = e;
              e = g ? (0 - a) | 0 : a;
              f = g ? (0 - ((((a | 0) != 0) + f) | 0)) | 0 : f;
              break a;
            }
            f = -2147483648;
            if (J[(a + 116) >> 2] < 0) {
              break a;
            }
            J[(a + 4) >> 2] = J[(a + 4) >> 2] - 1;
            na = -2147483648;
            return 0;
          }
          na = f;
          return e;
        }
        function ae(a, b, c, d, e, f, g, h) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          f = f | 0;
          g = g | 0;
          h = h | 0;
          var i = 0,
            j = 0,
            k = 0,
            l = 0;
          a = (ka - 16) | 0;
          ka = a;
          J[(a + 12) >> 2] = c;
          J[(a + 8) >> 2] = f;
          a: {
            b: {
              while (1) {
                if (!((c >>> 0 >= d >>> 0) | (f >>> 0 >= g >>> 0))) {
                  i = H[c | 0];
                  b = i & 255;
                  c: {
                    if ((i | 0) >= 0) {
                      if (b >>> 0 > 1114111) {
                        break b;
                      }
                      i = 1;
                      break c;
                    }
                    if (i >>> 0 < 4294967234) {
                      break b;
                    }
                    if (i >>> 0 <= 4294967263) {
                      i = 1;
                      if (((d - c) | 0) < 2) {
                        break a;
                      }
                      i = 2;
                      j = K[(c + 1) | 0];
                      if ((j & 192) != 128) {
                        break a;
                      }
                      b = (j & 63) | ((b << 6) & 1984);
                      i = 2;
                      break c;
                    }
                    if (i >>> 0 <= 4294967279) {
                      i = 1;
                      k = (d - c) | 0;
                      if ((k | 0) < 2) {
                        break a;
                      }
                      j = H[(c + 1) | 0];
                      d: {
                        e: {
                          if ((b | 0) != 237) {
                            if ((b | 0) != 224) {
                              break e;
                            }
                            if ((j & -32) == -96) {
                              break d;
                            }
                            break b;
                          }
                          if ((j | 0) < -96) {
                            break d;
                          }
                          break b;
                        }
                        if ((j | 0) > -65) {
                          break b;
                        }
                      }
                      if ((k | 0) == 2) {
                        break a;
                      }
                      i = K[(c + 2) | 0];
                      if ((i & 192) != 128) {
                        break b;
                      }
                      b = (i & 63) | (((b << 12) & 61440) | ((j & 63) << 6));
                      i = 3;
                      break c;
                    }
                    if (i >>> 0 > 4294967284) {
                      break b;
                    }
                    i = 1;
                    k = (d - c) | 0;
                    if ((k | 0) < 2) {
                      break a;
                    }
                    j = H[(c + 1) | 0];
                    f: {
                      g: {
                        switch ((b - 240) | 0) {
                          case 0:
                            if (((j + 112) & 255) >>> 0 >= 48) {
                              break b;
                            }
                            break f;
                          case 4:
                            if ((j | 0) >= -112) {
                              break b;
                            }
                            break f;
                          default:
                            break g;
                        }
                      }
                      if ((j | 0) > -65) {
                        break b;
                      }
                    }
                    if ((k | 0) == 2) {
                      break a;
                    }
                    l = K[(c + 2) | 0];
                    if ((l & 192) != 128) {
                      break b;
                    }
                    if ((k | 0) == 3) {
                      break a;
                    }
                    k = K[(c + 3) | 0];
                    if ((k & 192) != 128) {
                      break b;
                    }
                    i = 2;
                    b =
                      (k & 63) |
                      (((l << 6) & 4032) |
                        (((b << 18) & 1835008) | ((j & 63) << 12)));
                    if (b >>> 0 > 1114111) {
                      break a;
                    }
                    i = 4;
                  }
                  J[f >> 2] = b;
                  c = (c + i) | 0;
                  J[(a + 12) >> 2] = c;
                  f = (f + 4) | 0;
                  J[(a + 8) >> 2] = f;
                  continue;
                }
                break;
              }
              i = c >>> 0 < d >>> 0;
              break a;
            }
            i = 2;
          }
          J[e >> 2] = J[(a + 12) >> 2];
          J[h >> 2] = J[(a + 8) >> 2];
          ka = (a + 16) | 0;
          return i | 0;
        }
        function Hj(a) {
          a = a | 0;
          var b = 0,
            c = 0,
            d = 0,
            e = 0,
            f = 0,
            g = 0;
          e = (ka - 16) | 0;
          ka = e;
          a: {
            if (!J[(a + 64) >> 2]) {
              break a;
            }
            b: {
              d = J[(a + 68) >> 2];
              if (d) {
                c = J[(a + 92) >> 2];
                if (c & 16) {
                  if (J[(a + 24) >> 2] != J[(a + 20) >> 2]) {
                    b = -1;
                    if ((oa[J[(J[a >> 2] + 52) >> 2]](a, -1) | 0) == -1) {
                      break a;
                    }
                  }
                  d = (a + 72) | 0;
                  while (1) {
                    b = J[(a + 68) >> 2];
                    c = J[(a + 32) >> 2];
                    c =
                      oa[J[(J[b >> 2] + 20) >> 2]](
                        b,
                        d,
                        c,
                        (c + J[(a + 52) >> 2]) | 0,
                        (e + 12) | 0,
                      ) | 0;
                    f = J[(a + 32) >> 2];
                    b = (J[(e + 12) >> 2] - f) | 0;
                    if ((ab(f, 1, b, J[(a + 64) >> 2]) | 0) != (b | 0)) {
                      break b;
                    }
                    c: {
                      switch ((c - 1) | 0) {
                        case 1:
                          break b;
                        case 0:
                          continue;
                        default:
                          break c;
                      }
                    }
                    break;
                  }
                  b = 0;
                  if (!Pb(J[(a + 64) >> 2])) {
                    break a;
                  }
                  break b;
                }
                if (!(c & 8)) {
                  break a;
                }
                b = J[(a + 84) >> 2];
                J[e >> 2] = J[(a + 80) >> 2];
                J[(e + 4) >> 2] = b;
                d: {
                  e: {
                    f: {
                      if (K[(a + 98) | 0] == 1) {
                        b = (J[(a + 16) >> 2] - J[(a + 12) >> 2]) | 0;
                        d = b >> 31;
                        break f;
                      }
                      c = oa[J[(J[d >> 2] + 24) >> 2]](d) | 0;
                      f = J[(a + 36) >> 2];
                      b = (J[(a + 40) >> 2] - f) | 0;
                      d = b >> 31;
                      if ((c | 0) > 0) {
                        c = P(c, (J[(a + 16) >> 2] - J[(a + 12) >> 2]) | 0);
                        d = (d + (c >> 31)) | 0;
                        f = b;
                        b = (b + c) | 0;
                        d = f >>> 0 > b >>> 0 ? (d + 1) | 0 : d;
                        break f;
                      }
                      c = J[(a + 12) >> 2];
                      if ((c | 0) != J[(a + 16) >> 2]) {
                        break e;
                      }
                    }
                    c = 0;
                    break d;
                  }
                  g = J[(a + 68) >> 2];
                  c =
                    oa[J[(J[g >> 2] + 32) >> 2]](
                      g,
                      e,
                      J[(a + 32) >> 2],
                      f,
                      (c - J[(a + 8) >> 2]) | 0,
                    ) | 0;
                  c = (J[(a + 36) >> 2] - ((c + J[(a + 32) >> 2]) | 0)) | 0;
                  d = (d + (c >> 31)) | 0;
                  f = b;
                  b = (b + c) | 0;
                  d = f >>> 0 > b >>> 0 ? (d + 1) | 0 : d;
                  c = 1;
                }
                if (
                  Sf(
                    J[(a + 64) >> 2],
                    (0 - b) | 0,
                    (0 - ((d + ((b | 0) != 0)) | 0)) | 0,
                    1,
                  )
                ) {
                  break b;
                }
                if (c) {
                  b = J[(e + 4) >> 2];
                  J[(a + 72) >> 2] = J[e >> 2];
                  J[(a + 76) >> 2] = b;
                }
                b = 0;
                J[(a + 92) >> 2] = 0;
                J[(a + 16) >> 2] = 0;
                J[(a + 8) >> 2] = 0;
                J[(a + 12) >> 2] = 0;
                d = J[(a + 32) >> 2];
                J[(a + 40) >> 2] = d;
                J[(a + 36) >> 2] = d;
                break a;
              }
              Oa();
              y();
            }
            b = -1;
          }
          ka = (e + 16) | 0;
          return b | 0;
        }
        function Bg(a, b, c, d, e) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          var f = 0,
            g = 0,
            h = 0;
          a: {
            if (pb(a, J[(b + 8) >> 2], e)) {
              if ((J[(b + 28) >> 2] == 1) | (J[(b + 4) >> 2] != (c | 0))) {
                break a;
              }
              J[(b + 28) >> 2] = d;
              return;
            }
            b: {
              if (pb(a, J[b >> 2], e)) {
                if (
                  !(
                    (J[(b + 16) >> 2] != (c | 0)) &
                    (J[(b + 20) >> 2] != (c | 0))
                  )
                ) {
                  if ((d | 0) != 1) {
                    break a;
                  }
                  J[(b + 32) >> 2] = 1;
                  return;
                }
                J[(b + 32) >> 2] = d;
                if (J[(b + 44) >> 2] == 4) {
                  break b;
                }
                f = (a + 16) | 0;
                g = (f + (J[(a + 12) >> 2] << 3)) | 0;
                d = 0;
                while (1) {
                  c: {
                    d: {
                      e: {
                        f: {
                          if (f >>> 0 >= g >>> 0) {
                            break f;
                          }
                          I[(b + 52) >> 1] = 0;
                          Jc(f, b, c, c, 1, e);
                          if (K[(b + 54) | 0]) {
                            break f;
                          }
                          if (K[(b + 53) | 0] != 1) {
                            break c;
                          }
                          if (K[(b + 52) | 0] == 1) {
                            if (J[(b + 24) >> 2] == 1) {
                              break d;
                            }
                            d = 1;
                            h = 1;
                            if (!(K[(a + 8) | 0] & 2)) {
                              break d;
                            }
                            break c;
                          }
                          d = 1;
                          if (H[(a + 8) | 0] & 1) {
                            break c;
                          }
                          a = 3;
                          break e;
                        }
                        a = d ? 3 : 4;
                      }
                      J[(b + 44) >> 2] = a;
                      if (h) {
                        break a;
                      }
                      break b;
                    }
                    J[(b + 44) >> 2] = 3;
                    break a;
                  }
                  f = (f + 8) | 0;
                  continue;
                }
              }
              f = J[(a + 12) >> 2];
              g = (a + 16) | 0;
              kc(g, b, c, d, e);
              if (f >>> 0 < 2) {
                break a;
              }
              g = (g + (f << 3)) | 0;
              f = (a + 24) | 0;
              a = J[(a + 8) >> 2];
              if (!(!(a & 2) & (J[(b + 36) >> 2] != 1))) {
                while (1) {
                  if (K[(b + 54) | 0]) {
                    break a;
                  }
                  kc(f, b, c, d, e);
                  f = (f + 8) | 0;
                  if (g >>> 0 > f >>> 0) {
                    continue;
                  }
                  break;
                }
                break a;
              }
              if (!(a & 1)) {
                while (1) {
                  if (K[(b + 54) | 0] | (J[(b + 36) >> 2] == 1)) {
                    break a;
                  }
                  kc(f, b, c, d, e);
                  f = (f + 8) | 0;
                  if (g >>> 0 > f >>> 0) {
                    continue;
                  }
                  break a;
                }
              }
              while (1) {
                if (
                  K[(b + 54) | 0] |
                  ((J[(b + 36) >> 2] == 1) & (J[(b + 24) >> 2] == 1))
                ) {
                  break a;
                }
                kc(f, b, c, d, e);
                f = (f + 8) | 0;
                if (g >>> 0 > f >>> 0) {
                  continue;
                }
                break;
              }
              break a;
            }
            J[(b + 20) >> 2] = c;
            J[(b + 40) >> 2] = J[(b + 40) >> 2] + 1;
            if ((J[(b + 36) >> 2] != 1) | (J[(b + 24) >> 2] != 2)) {
              break a;
            }
            H[(b + 54) | 0] = 1;
          }
        }
        function sb(a, b, c, d, e, f, g, h) {
          var i = 0,
            j = 0,
            k = 0,
            l = 0,
            m = 0,
            n = 0;
          i = (ka - 16) | 0;
          ka = i;
          J[(i + 8) >> 2] = c;
          J[(i + 12) >> 2] = b;
          b = (i + 4) | 0;
          Ha(b, d);
          j = eb(b);
          Ka(J[(i + 4) >> 2]);
          J[e >> 2] = 0;
          b = 0;
          a: {
            while (1) {
              if (((g | 0) == (h | 0)) | b) {
                break a;
              }
              b: {
                if (Ma((i + 12) | 0, (i + 8) | 0)) {
                  break b;
                }
                c: {
                  if (
                    (oa[J[(J[j >> 2] + 36) >> 2]](j, H[g | 0], 0) | 0) ==
                    37
                  ) {
                    if (((g + 1) | 0) == (h | 0)) {
                      break b;
                    }
                    c = 0;
                    d: {
                      e: {
                        b =
                          oa[J[(J[j >> 2] + 36) >> 2]](j, H[(g + 1) | 0], 0) |
                          0;
                        if ((b | 0) == 69) {
                          break e;
                        }
                        k = 1;
                        if ((b & 255) == 48) {
                          break e;
                        }
                        break d;
                      }
                      if (((g + 2) | 0) == (h | 0)) {
                        break b;
                      }
                      k = 2;
                      c = b;
                      b =
                        oa[J[(J[j >> 2] + 36) >> 2]](j, H[(g + 2) | 0], 0) | 0;
                    }
                    ((l = i),
                      (m =
                        oa[J[(J[a >> 2] + 36) >> 2]](
                          a,
                          J[(i + 12) >> 2],
                          J[(i + 8) >> 2],
                          d,
                          e,
                          f,
                          b,
                          c,
                        ) | 0),
                      (J[(l + 12) >> 2] = m));
                    g = (((g + k) | 0) + 1) | 0;
                    break c;
                  }
                  f: {
                    b = H[g | 0];
                    if ((b | 0) < 0) {
                      break f;
                    }
                    c = b << 2;
                    b = J[(j + 8) >> 2];
                    if (!(H[(c + b) | 0] & 1)) {
                      break f;
                    }
                    while (1) {
                      g: {
                        g = (g + 1) | 0;
                        if ((h | 0) == (g | 0)) {
                          g = h;
                          break g;
                        }
                        c = H[g | 0];
                        if ((c | 0) < 0) {
                          break g;
                        }
                        if (H[(b + (c << 2)) | 0] & 1) {
                          continue;
                        }
                      }
                      break;
                    }
                    while (1) {
                      if (Ma((i + 12) | 0, (i + 8) | 0)) {
                        break c;
                      }
                      b = $a(J[(i + 12) >> 2]);
                      if (
                        (b & 128) |
                        !(H[(J[(j + 8) >> 2] + ((b & 127) << 2)) | 0] & 1)
                      ) {
                        break c;
                      }
                      db(J[(i + 12) >> 2]);
                      continue;
                    }
                  }
                  if (
                    (((m = j),
                    (n = ($a(J[(i + 12) >> 2]) << 24) >> 24),
                    (l = J[(J[j >> 2] + 12) >> 2]),
                    oa[l](m | 0, n | 0) | 0) |
                      0) ==
                    (oa[J[(J[j >> 2] + 12) >> 2]](j, H[g | 0]) | 0)
                  ) {
                    db(J[(i + 12) >> 2]);
                    g = (g + 1) | 0;
                    break c;
                  }
                  J[e >> 2] = 4;
                }
                b = J[e >> 2];
                continue;
              }
              break;
            }
            J[e >> 2] = 4;
          }
          if (Ma((i + 12) | 0, (i + 8) | 0)) {
            J[e >> 2] = J[e >> 2] | 2;
          }
          ka = (i + 16) | 0;
          return J[(i + 12) >> 2];
        }
        function hf(a, b, c, d, e) {
          var f = 0,
            g = 0,
            h = 0,
            i = 0,
            j = 0,
            k = 0,
            l = 0,
            m = 0,
            n = 0,
            o = 0,
            p = 0;
          l = (ka - 16) | 0;
          ka = l;
          a: {
            b: {
              c: {
                if ((c | 0) <= 36) {
                  g = K[a | 0];
                  if (g) {
                    break c;
                  }
                  f = a;
                  break b;
                }
                J[4158] = 28;
                d = 0;
                e = 0;
                break a;
              }
              f = a;
              d: {
                while (1) {
                  if (!yb((g << 24) >> 24)) {
                    break d;
                  }
                  g = K[(f + 1) | 0];
                  f = (f + 1) | 0;
                  if (g) {
                    continue;
                  }
                  break;
                }
                break b;
              }
              e: {
                h = g & 255;
                switch ((h - 43) | 0) {
                  case 0:
                  case 2:
                    break e;
                  default:
                    break b;
                }
              }
              j = (h | 0) == 45 ? -1 : 0;
              f = (f + 1) | 0;
            }
            f: {
              if (!(((c | 16) != 16) | (K[f | 0] != 48))) {
                n = 1;
                if ((K[(f + 1) | 0] & 223) == 88) {
                  f = (f + 2) | 0;
                  m = 16;
                  break f;
                }
                f = (f + 1) | 0;
                m = c ? c : 8;
                break f;
              }
              m = c ? c : 10;
            }
            c = 0;
            while (1) {
              g: {
                h = K[f | 0];
                g = (h - 48) | 0;
                h: {
                  if ((g & 255) >>> 0 < 10) {
                    break h;
                  }
                  if (((h - 97) & 255) >>> 0 <= 25) {
                    g = (h - 87) | 0;
                    break h;
                  }
                  if (((h - 65) & 255) >>> 0 > 25) {
                    break g;
                  }
                  g = (h - 55) | 0;
                }
                g = g & 255;
                if ((g | 0) >= (m | 0)) {
                  break g;
                }
                Sa(l, m, 0, 0, 0, k, i, 0, 0);
                h = 1;
                i: {
                  if (J[(l + 8) >> 2] | J[(l + 12) >> 2]) {
                    break i;
                  }
                  o = dk(k, i, m, 0);
                  p = na;
                  if (((p | 0) == -1) & ((g ^ -1) >>> 0 < o >>> 0)) {
                    break i;
                  }
                  i = p;
                  k = (g + o) | 0;
                  i = k >>> 0 < g >>> 0 ? (i + 1) | 0 : i;
                  n = 1;
                  h = c;
                }
                f = (f + 1) | 0;
                c = h;
                continue;
              }
              break;
            }
            if (b) {
              J[b >> 2] = n ? f : a;
            }
            j: {
              k: {
                if (c) {
                  J[4158] = 68;
                  j = d & 1 ? 0 : j;
                  k = d;
                  i = e;
                  break k;
                }
                if (
                  (((e | 0) == (i | 0)) & (d >>> 0 > k >>> 0)) |
                  (e >>> 0 > i >>> 0)
                ) {
                  break j;
                }
              }
              if (!((d & 1) | j)) {
                J[4158] = 68;
                a = d;
                d = (a - 1) | 0;
                e = (e - !a) | 0;
                break a;
              }
              if (
                (((e | 0) == (i | 0)) & (d >>> 0 >= k >>> 0)) |
                (e >>> 0 > i >>> 0)
              ) {
                break j;
              }
              J[4158] = 68;
              break a;
            }
            a = j ^ k;
            d = (a - j) | 0;
            b = j >> 31;
            e = ((b ^ i) - (((a >>> 0 < j >>> 0) + b) | 0)) | 0;
          }
          ka = (l + 16) | 0;
          na = e;
          return d;
        }
        function rc(a, b, c, d, e, f, g) {
          var h = 0,
            i = 0,
            j = 0,
            k = 0,
            l = 0,
            m = 0,
            n = 0,
            o = 0,
            p = 0,
            q = 0,
            r = 0,
            s = 0,
            t = 0,
            u = 0;
          n = (ka - 112) | 0;
          ka = n;
          J[(n + 108) >> 2] = b;
          j = n;
          a: {
            b: {
              c: {
                k = (((d - c) | 0) / 12) | 0;
                if (k >>> 0 >= 101) {
                  q = Wa(k);
                  j = q;
                  if (!j) {
                    break c;
                  }
                }
                h = j;
                b = c;
                while (1)
                  if ((b | 0) == (d | 0)) {
                    i = 0;
                    d: while (1) {
                      b = (n + 108) | 0;
                      if (((s = La(a, b)), (t = 1), (u = k), u ? s : t)) {
                        if (La(a, b)) {
                          J[f >> 2] = J[f >> 2] | 2;
                        }
                        while (1) {
                          if ((c | 0) == (d | 0)) {
                            break b;
                          }
                          if (K[j | 0] == 2) {
                            break a;
                          }
                          j = (j + 1) | 0;
                          c = (c + 12) | 0;
                          continue;
                        }
                      }
                      p = Xb(a);
                      if (!g) {
                        p = oa[J[(J[e >> 2] + 28) >> 2]](e, p) | 0;
                      }
                      o = (i + 1) | 0;
                      r = 0;
                      h = j;
                      b = c;
                      while (1)
                        if ((b | 0) == (d | 0)) {
                          i = o;
                          if (!r) {
                            continue d;
                          }
                          qc(a);
                          h = j;
                          b = c;
                          if ((k + l) >>> 0 < 2) {
                            continue d;
                          }
                          while (1) {
                            if ((b | 0) == (d | 0)) {
                              continue d;
                            }
                            e: {
                              if (K[h | 0] != 2) {
                                break e;
                              }
                              o = H[(b + 11) | 0];
                              if (
                                (((o | 0) < 0 ? J[(b + 4) >> 2] : o) | 0) ==
                                (i | 0)
                              ) {
                                break e;
                              }
                              H[h | 0] = 0;
                              l = (l - 1) | 0;
                            }
                            h = (h + 1) | 0;
                            b = (b + 12) | 0;
                            continue;
                          }
                        } else {
                          f: {
                            if (K[h | 0] != 1) {
                              break f;
                            }
                            m =
                              J[
                                ((i << 2) +
                                  (H[(b + 11) | 0] < 0 ? J[b >> 2] : b)) >>
                                  2
                              ];
                            if (!g) {
                              m = oa[J[(J[e >> 2] + 28) >> 2]](e, m) | 0;
                            }
                            g: {
                              if ((m | 0) == (p | 0)) {
                                r = 1;
                                m = H[(b + 11) | 0];
                                if (
                                  (o | 0) !=
                                  (((m | 0) < 0 ? J[(b + 4) >> 2] : m) | 0)
                                ) {
                                  break f;
                                }
                                H[h | 0] = 2;
                                l = (l + 1) | 0;
                                break g;
                              }
                              H[h | 0] = 0;
                            }
                            k = (k - 1) | 0;
                          }
                          h = (h + 1) | 0;
                          b = (b + 12) | 0;
                          continue;
                        }
                    }
                  } else {
                    i = H[(b + 11) | 0];
                    i = (i | 0) < 0 ? J[(b + 4) >> 2] : i;
                    H[h | 0] = i ? 1 : 2;
                    h = (h + 1) | 0;
                    b = (b + 12) | 0;
                    i = !i;
                    l = (i + l) | 0;
                    k = (k - i) | 0;
                    continue;
                  }
              }
              Oa();
              y();
            }
            J[f >> 2] = J[f >> 2] | 4;
          }
          Aa(q);
          ka = (n + 112) | 0;
          return c;
        }
        function tc(a, b, c, d, e, f, g) {
          var h = 0,
            i = 0,
            j = 0,
            k = 0,
            l = 0,
            m = 0,
            n = 0,
            o = 0,
            p = 0,
            q = 0,
            r = 0,
            s = 0,
            t = 0,
            u = 0;
          n = (ka - 112) | 0;
          ka = n;
          J[(n + 108) >> 2] = b;
          j = n;
          a: {
            b: {
              c: {
                k = (((d - c) | 0) / 12) | 0;
                if (k >>> 0 >= 101) {
                  q = Wa(k);
                  j = q;
                  if (!j) {
                    break c;
                  }
                }
                h = j;
                b = c;
                while (1)
                  if ((b | 0) == (d | 0)) {
                    i = 0;
                    d: while (1) {
                      b = (n + 108) | 0;
                      if (((s = Ma(a, b)), (t = 1), (u = k), u ? s : t)) {
                        if (Ma(a, b)) {
                          J[f >> 2] = J[f >> 2] | 2;
                        }
                        while (1) {
                          if ((c | 0) == (d | 0)) {
                            break b;
                          }
                          if (K[j | 0] == 2) {
                            break a;
                          }
                          j = (j + 1) | 0;
                          c = (c + 12) | 0;
                          continue;
                        }
                      }
                      p = _b(a);
                      if (!g) {
                        p = oa[J[(J[e >> 2] + 12) >> 2]](e, p) | 0;
                      }
                      o = (i + 1) | 0;
                      r = 0;
                      h = j;
                      b = c;
                      while (1)
                        if ((b | 0) == (d | 0)) {
                          i = o;
                          if (!r) {
                            continue d;
                          }
                          sc(a);
                          h = j;
                          b = c;
                          if ((k + l) >>> 0 < 2) {
                            continue d;
                          }
                          while (1) {
                            if ((b | 0) == (d | 0)) {
                              continue d;
                            }
                            e: {
                              if (K[h | 0] != 2) {
                                break e;
                              }
                              o = H[(b + 11) | 0];
                              if (
                                (((o | 0) < 0 ? J[(b + 4) >> 2] : o) | 0) ==
                                (i | 0)
                              ) {
                                break e;
                              }
                              H[h | 0] = 0;
                              l = (l - 1) | 0;
                            }
                            h = (h + 1) | 0;
                            b = (b + 12) | 0;
                            continue;
                          }
                        } else {
                          f: {
                            if (K[h | 0] != 1) {
                              break f;
                            }
                            m =
                              H[
                                ((H[(b + 11) | 0] < 0 ? J[b >> 2] : b) + i) | 0
                              ];
                            if (!g) {
                              m = oa[J[(J[e >> 2] + 12) >> 2]](e, m) | 0;
                            }
                            g: {
                              if ((m | 0) == (p | 0)) {
                                r = 1;
                                m = H[(b + 11) | 0];
                                if (
                                  (o | 0) !=
                                  (((m | 0) < 0 ? J[(b + 4) >> 2] : m) | 0)
                                ) {
                                  break f;
                                }
                                H[h | 0] = 2;
                                l = (l + 1) | 0;
                                break g;
                              }
                              H[h | 0] = 0;
                            }
                            k = (k - 1) | 0;
                          }
                          h = (h + 1) | 0;
                          b = (b + 12) | 0;
                          continue;
                        }
                    }
                  } else {
                    i = H[(b + 11) | 0];
                    i = (i | 0) < 0 ? J[(b + 4) >> 2] : i;
                    H[h | 0] = i ? 1 : 2;
                    h = (h + 1) | 0;
                    b = (b + 12) | 0;
                    i = !i;
                    l = (i + l) | 0;
                    k = (k - i) | 0;
                    continue;
                  }
              }
              Oa();
              y();
            }
            J[f >> 2] = J[f >> 2] | 4;
          }
          Aa(q);
          ka = (n + 112) | 0;
          return c;
        }
        function rb(a, b, c, d, e, f, g, h) {
          var i = 0,
            j = 0,
            k = 0,
            l = 0,
            m = 0,
            n = 0,
            o = 0;
          i = (ka - 16) | 0;
          ka = i;
          J[(i + 8) >> 2] = c;
          J[(i + 12) >> 2] = b;
          b = (i + 4) | 0;
          Ha(b, d);
          j = ib(b);
          Ka(J[(i + 4) >> 2]);
          J[e >> 2] = 0;
          b = 0;
          a: {
            while (1) {
              if (((g | 0) == (h | 0)) | b) {
                break a;
              }
              b: {
                if (La((i + 12) | 0, (i + 8) | 0)) {
                  break b;
                }
                c: {
                  if (
                    (oa[J[(J[j >> 2] + 52) >> 2]](j, J[g >> 2], 0) | 0) ==
                    37
                  ) {
                    if (((g + 4) | 0) == (h | 0)) {
                      break b;
                    }
                    c = 0;
                    d: {
                      e: {
                        b =
                          oa[J[(J[j >> 2] + 52) >> 2]](j, J[(g + 4) >> 2], 0) |
                          0;
                        if ((b | 0) == 69) {
                          break e;
                        }
                        k = 4;
                        if ((b & 255) == 48) {
                          break e;
                        }
                        break d;
                      }
                      if (((g + 8) | 0) == (h | 0)) {
                        break b;
                      }
                      k = 8;
                      c = b;
                      b =
                        oa[J[(J[j >> 2] + 52) >> 2]](j, J[(g + 8) >> 2], 0) | 0;
                    }
                    ((l = i),
                      (m =
                        oa[J[(J[a >> 2] + 36) >> 2]](
                          a,
                          J[(i + 12) >> 2],
                          J[(i + 8) >> 2],
                          d,
                          e,
                          f,
                          b,
                          c,
                        ) | 0),
                      (J[(l + 12) >> 2] = m));
                    g = (((g + k) | 0) + 4) | 0;
                    break c;
                  }
                  if (oa[J[(J[j >> 2] + 12) >> 2]](j, 1, J[g >> 2]) | 0) {
                    while (1) {
                      g = (g + 4) | 0;
                      if ((h | 0) != (g | 0)) {
                        if (oa[J[(J[j >> 2] + 12) >> 2]](j, 1, J[g >> 2]) | 0) {
                          continue;
                        }
                      }
                      break;
                    }
                    while (1) {
                      if (La((i + 12) | 0, (i + 8) | 0)) {
                        break c;
                      }
                      if (
                        !((m = j),
                        (n = 1),
                        (o = _a(J[(i + 12) >> 2])),
                        (l = J[(J[j >> 2] + 12) >> 2]),
                        oa[l](m | 0, n | 0, o | 0) | 0)
                      ) {
                        break c;
                      }
                      cb(J[(i + 12) >> 2]);
                      continue;
                    }
                  }
                  if (
                    (((o = j),
                    (n = _a(J[(i + 12) >> 2])),
                    (l = J[(J[j >> 2] + 28) >> 2]),
                    oa[l](o | 0, n | 0) | 0) |
                      0) ==
                    (oa[J[(J[j >> 2] + 28) >> 2]](j, J[g >> 2]) | 0)
                  ) {
                    cb(J[(i + 12) >> 2]);
                    g = (g + 4) | 0;
                    break c;
                  }
                  J[e >> 2] = 4;
                }
                b = J[e >> 2];
                continue;
              }
              break;
            }
            J[e >> 2] = 4;
          }
          if (La((i + 12) | 0, (i + 8) | 0)) {
            J[e >> 2] = J[e >> 2] | 2;
          }
          ka = (i + 16) | 0;
          return J[(i + 12) >> 2];
        }
        function fd(a, b, c, d) {
          var e = 0,
            f = 0,
            g = 0,
            h = 0,
            i = 0,
            j = 0;
          g = (ka - 32) | 0;
          ka = g;
          e = d & 65535;
          f = (d >>> 16) & 32767;
          j = f;
          a: {
            if ((f - 15361) >>> 0 <= 2045) {
              e = (e << 4) | (c >>> 28);
              c = c << 4;
              f = e;
              e = (b >>> 28) | c;
              c = f;
              f = (j - 15360) | 0;
              b = b & 268435455;
              b: {
                if (
                  (((b | 0) == 134217728) & ((a | 0) != 0)) |
                  (b >>> 0 > 134217728)
                ) {
                  e = (e + 1) | 0;
                  c = e ? c : (c + 1) | 0;
                  break b;
                }
                if (a | ((b | 0) != 134217728)) {
                  break b;
                }
                a = e;
                e = (e + (e & 1)) | 0;
                c = a >>> 0 > e >>> 0 ? (c + 1) | 0 : c;
              }
              h = c >>> 0 > 1048575;
              a = h ? 0 : e;
              b = h ? 0 : c;
              e = 0;
              c = (f + h) | 0;
              f = c >>> 0 < f >>> 0 ? 1 : e;
              break a;
            }
            if (!(!(a | c | (b | e)) | (((f | 0) != 32767) | ((h | 0) != 0)))) {
              a = c;
              c = (e << 4) | (c >>> 28);
              a = (a << 4) | (b >>> 28);
              b = c | 524288;
              c = 2047;
              f = 0;
              break a;
            }
            if (j >>> 0 > 17406) {
              a = 0;
              b = 0;
              c = 2047;
              f = 0;
              break a;
            }
            i = !(f | h);
            f = i ? 15360 : 15361;
            h = (f - j) | 0;
            if ((h | 0) > 112) {
              a = 0;
              b = 0;
              c = 0;
              f = 0;
              break a;
            }
            e = i ? e : e | 65536;
            i = 0;
            if ((f | 0) != (j | 0)) {
              Ta((g + 16) | 0, a, b, c, e, (128 - h) | 0);
              i =
                (J[(g + 16) >> 2] |
                  J[(g + 24) >> 2] |
                  (J[(g + 20) >> 2] | J[(g + 28) >> 2])) !=
                0;
            }
            Gb(g, a, b, c, e, h);
            a = J[(g + 8) >> 2];
            h = a << 4;
            b = (J[(g + 12) >> 2] << 4) | (a >>> 28);
            a = J[(g + 4) >> 2];
            f = a;
            a = (a >>> 28) | h;
            f = f & 268435455;
            c = J[g >> 2] | i;
            c: {
              if (
                (((f | 0) == 134217728) & ((c | 0) != 0)) |
                (f >>> 0 > 134217728)
              ) {
                a = (a + 1) | 0;
                b = a ? b : (b + 1) | 0;
                break c;
              }
              if (c | ((f | 0) != 134217728)) {
                break c;
              }
              e = b;
              b = a;
              a = (a + (a & 1)) | 0;
              b = b >>> 0 > a >>> 0 ? (e + 1) | 0 : e;
            }
            c = b >>> 0 > 1048575;
            b = c ? b ^ 1048576 : b;
            f = 0;
          }
          ka = (g + 32) | 0;
          u(0, a | 0);
          u(1, b | ((d & -2147483648) | (c << 20)));
          return +w();
        }
        function pf(a, b) {
          var c = 0,
            d = 0,
            e = 0,
            f = 0,
            g = 0,
            h = 0,
            i = 0,
            j = 0,
            k = 0,
            l = 0;
          d = (ka - 32) | 0;
          ka = d;
          a: {
            if (K[(a + 52) | 0] == 1) {
              e = J[(a + 48) >> 2];
              if (!b) {
                break a;
              }
              H[(a + 52) | 0] = 0;
              J[(a + 48) >> 2] = -1;
              break a;
            }
            b: {
              c: {
                if (K[(a + 53) | 0] == 1) {
                  e = -1;
                  c = J[(a + 32) >> 2];
                  d: {
                    if (J[(c + 76) >> 2] < 0) {
                      c = wf(c);
                      break d;
                    }
                    c = wf(c);
                  }
                  if ((c | 0) != -1) {
                    J[(d + 24) >> 2] = c;
                  }
                  if ((c | 0) == -1) {
                    break a;
                  }
                  e = J[(d + 24) >> 2];
                  if (b) {
                    break c;
                  }
                  a = yf(e, J[(a + 32) >> 2]);
                  e = (a | 0) == -1 ? -1 : J[(d + 24) >> 2];
                  break a;
                }
                e = J[(a + 44) >> 2];
                f = (e | 0) <= 1 ? 1 : e;
                while (1) {
                  if ((c | 0) != (f | 0)) {
                    e = -1;
                    g = dc(J[(a + 32) >> 2]);
                    if ((g | 0) == -1) {
                      break a;
                    }
                    H[(((d + 24) | 0) + c) | 0] = g;
                    c = (c + 1) | 0;
                    continue;
                  }
                  break;
                }
                k = (d + 24) | 0;
                e: {
                  while (1) {
                    f: {
                      g = J[(a + 40) >> 2];
                      c = J[g >> 2];
                      l = J[(g + 4) >> 2];
                      e = -1;
                      h = (d + 24) | 0;
                      i = (h + f) | 0;
                      g: {
                        j = J[(a + 36) >> 2];
                        switch (
                          ((oa[J[(J[j >> 2] + 16) >> 2]](
                            j,
                            g,
                            h,
                            i,
                            (d + 16) | 0,
                            (d + 20) | 0,
                            k,
                            (d + 12) | 0,
                          ) |
                            0) -
                            1) |
                          0
                        ) {
                          case 1:
                            break a;
                          case 0:
                            break g;
                          case 2:
                            break f;
                          default:
                            break e;
                        }
                      }
                      g = J[(a + 40) >> 2];
                      J[g >> 2] = c;
                      J[(g + 4) >> 2] = l;
                      if ((f | 0) == 8) {
                        break a;
                      }
                      c = dc(J[(a + 32) >> 2]);
                      if ((c | 0) == -1) {
                        break a;
                      }
                      H[i | 0] = c;
                      f = (f + 1) | 0;
                      continue;
                    }
                    break;
                  }
                  J[(d + 20) >> 2] = H[(d + 24) | 0];
                }
                if (!b) {
                  while (1) {
                    if ((f | 0) <= 0) {
                      break b;
                    }
                    f = (f - 1) | 0;
                    if (
                      (Hb(H[(f + ((d + 24) | 0)) | 0], J[(a + 32) >> 2]) | 0) !=
                      -1
                    ) {
                      continue;
                    }
                    break a;
                  }
                }
                e = J[(d + 20) >> 2];
              }
              J[(a + 48) >> 2] = e;
              break a;
            }
            e = J[(d + 20) >> 2];
          }
          ka = (d + 32) | 0;
          return e;
        }
        function Wc(a, b, c, d, e, f, g, h, i, j, k, l) {
          var m = 0,
            n = 0,
            o = 0;
          m = (ka - 16) | 0;
          ka = m;
          J[(m + 12) >> 2] = a;
          a: {
            b: {
              if ((a | 0) == (f | 0)) {
                if (K[b | 0] != 1) {
                  break b;
                }
                a = 0;
                H[b | 0] = 0;
                b = J[e >> 2];
                J[e >> 2] = b + 1;
                H[b | 0] = 46;
                b = H[(h + 11) | 0];
                if (!((b | 0) < 0 ? J[(h + 4) >> 2] : b)) {
                  break a;
                }
                b = J[j >> 2];
                if (((b - i) | 0) > 159) {
                  break a;
                }
                c = J[k >> 2];
                J[j >> 2] = b + 4;
                J[b >> 2] = c;
                break a;
              }
              c: {
                d: {
                  if ((a | 0) != (g | 0)) {
                    break d;
                  }
                  a = H[(h + 11) | 0];
                  if (!((a | 0) < 0 ? J[(h + 4) >> 2] : a)) {
                    break d;
                  }
                  if (K[b | 0] != 1) {
                    break b;
                  }
                  a = J[j >> 2];
                  if (((a - i) | 0) > 159) {
                    break c;
                  }
                  b = J[k >> 2];
                  J[j >> 2] = a + 4;
                  J[a >> 2] = b;
                  a = 0;
                  J[k >> 2] = 0;
                  break a;
                }
                a = (Ie(l, (l + 112) | 0, (m + 12) | 0) - l) | 0;
                g = a >> 2;
                if ((g | 0) > 27) {
                  break b;
                }
                f = H[(g + 7520) | 0];
                e: {
                  f: {
                    a = a & -5;
                    if ((a | 0) != 88) {
                      if ((a | 0) != 96) {
                        break f;
                      }
                      b = J[e >> 2];
                      if ((b | 0) != (d | 0)) {
                        a = -1;
                        if ((Ob(H[(b - 1) | 0]) | 0) != (Ob(H[c | 0]) | 0)) {
                          break a;
                        }
                      }
                      J[e >> 2] = b + 1;
                      H[b | 0] = f;
                      break c;
                    }
                    H[c | 0] = 80;
                    break e;
                  }
                  a = Ob(f);
                  if ((a | 0) != H[c | 0]) {
                    break e;
                  }
                  ((n = c), (o = lf(a)), (H[n | 0] = o));
                  if (K[b | 0] != 1) {
                    break e;
                  }
                  H[b | 0] = 0;
                  a = H[(h + 11) | 0];
                  if (!((a | 0) < 0 ? J[(h + 4) >> 2] : a)) {
                    break e;
                  }
                  a = J[j >> 2];
                  if (((a - i) | 0) > 159) {
                    break e;
                  }
                  b = J[k >> 2];
                  J[j >> 2] = a + 4;
                  J[a >> 2] = b;
                }
                a = J[e >> 2];
                J[e >> 2] = a + 1;
                H[a | 0] = f;
                a = 0;
                if ((g | 0) > 21) {
                  break a;
                }
                J[k >> 2] = J[k >> 2] + 1;
                break a;
              }
              a = 0;
              break a;
            }
            a = -1;
          }
          ka = (m + 16) | 0;
          return a;
        }
        function Zc(a, b, c, d, e, f, g, h, i, j, k, l) {
          var m = 0,
            n = 0,
            o = 0;
          m = (ka - 16) | 0;
          ka = m;
          H[(m + 15) | 0] = a;
          a: {
            b: {
              if ((a | 0) == (f | 0)) {
                if (K[b | 0] != 1) {
                  break b;
                }
                a = 0;
                H[b | 0] = 0;
                b = J[e >> 2];
                J[e >> 2] = b + 1;
                H[b | 0] = 46;
                b = H[(h + 11) | 0];
                if (!((b | 0) < 0 ? J[(h + 4) >> 2] : b)) {
                  break a;
                }
                b = J[j >> 2];
                if (((b - i) | 0) > 159) {
                  break a;
                }
                c = J[k >> 2];
                J[j >> 2] = b + 4;
                J[b >> 2] = c;
                break a;
              }
              c: {
                d: {
                  if ((a | 0) != (g | 0)) {
                    break d;
                  }
                  a = H[(h + 11) | 0];
                  if (!((a | 0) < 0 ? J[(h + 4) >> 2] : a)) {
                    break d;
                  }
                  if (K[b | 0] != 1) {
                    break b;
                  }
                  a = J[j >> 2];
                  if (((a - i) | 0) > 159) {
                    break c;
                  }
                  b = J[k >> 2];
                  J[j >> 2] = a + 4;
                  J[a >> 2] = b;
                  a = 0;
                  J[k >> 2] = 0;
                  break a;
                }
                f = (Ke(l, (l + 28) | 0, (m + 15) | 0) - l) | 0;
                if ((f | 0) > 27) {
                  break b;
                }
                g = H[(f + 7520) | 0];
                e: {
                  f: {
                    switch (((f & -2) - 22) | 0) {
                      case 2:
                        b = J[e >> 2];
                        if ((b | 0) != (d | 0)) {
                          a = -1;
                          if ((Ob(H[(b - 1) | 0]) | 0) != (Ob(H[c | 0]) | 0)) {
                            break a;
                          }
                        }
                        J[e >> 2] = b + 1;
                        H[b | 0] = g;
                        break c;
                      case 0:
                        H[c | 0] = 80;
                        break e;
                      default:
                        break f;
                    }
                  }
                  a = Ob(g);
                  if ((a | 0) != H[c | 0]) {
                    break e;
                  }
                  ((n = c), (o = lf(a)), (H[n | 0] = o));
                  if (K[b | 0] != 1) {
                    break e;
                  }
                  H[b | 0] = 0;
                  a = H[(h + 11) | 0];
                  if (!((a | 0) < 0 ? J[(h + 4) >> 2] : a)) {
                    break e;
                  }
                  a = J[j >> 2];
                  if (((a - i) | 0) > 159) {
                    break e;
                  }
                  b = J[k >> 2];
                  J[j >> 2] = a + 4;
                  J[a >> 2] = b;
                }
                a = J[e >> 2];
                J[e >> 2] = a + 1;
                H[a | 0] = g;
                a = 0;
                if ((f | 0) > 21) {
                  break a;
                }
                J[k >> 2] = J[k >> 2] + 1;
                break a;
              }
              a = 0;
              break a;
            }
            a = -1;
          }
          ka = (m + 16) | 0;
          return a;
        }
        function sf(a, b) {
          var c = 0,
            d = 0,
            e = 0,
            f = 0,
            g = 0,
            h = 0,
            i = 0,
            j = 0,
            k = 0,
            l = 0;
          c = (ka - 32) | 0;
          ka = c;
          a: {
            if (K[(a + 52) | 0] == 1) {
              e = J[(a + 48) >> 2];
              if (!b) {
                break a;
              }
              H[(a + 52) | 0] = 0;
              J[(a + 48) >> 2] = -1;
              break a;
            }
            if (K[(a + 53) | 0] == 1) {
              e = -1;
              d = dc(J[(a + 32) >> 2]);
              if ((d | 0) != -1) {
                H[(c + 24) | 0] = d;
              }
              if ((d | 0) == -1) {
                break a;
              }
              d = K[(c + 24) | 0];
              if (!b) {
                if ((Hb(d, J[(a + 32) >> 2]) | 0) == -1) {
                  break a;
                }
                e = K[(c + 24) | 0];
                break a;
              }
              J[(a + 48) >> 2] = d;
              e = d;
              break a;
            }
            e = J[(a + 44) >> 2];
            f = (e | 0) <= 1 ? 1 : e;
            while (1) {
              if ((d | 0) != (f | 0)) {
                e = -1;
                g = dc(J[(a + 32) >> 2]);
                if ((g | 0) == -1) {
                  break a;
                }
                H[(((c + 24) | 0) + d) | 0] = g;
                d = (d + 1) | 0;
                continue;
              }
              break;
            }
            k = (c + 24) | 0;
            b: {
              while (1) {
                c: {
                  g = J[(a + 40) >> 2];
                  d = J[g >> 2];
                  l = J[(g + 4) >> 2];
                  e = -1;
                  h = (c + 24) | 0;
                  i = (h + f) | 0;
                  d: {
                    j = J[(a + 36) >> 2];
                    switch (
                      ((oa[J[(J[j >> 2] + 16) >> 2]](
                        j,
                        g,
                        h,
                        i,
                        (c + 16) | 0,
                        (c + 23) | 0,
                        k,
                        (c + 12) | 0,
                      ) |
                        0) -
                        1) |
                      0
                    ) {
                      case 1:
                        break a;
                      case 0:
                        break d;
                      case 2:
                        break c;
                      default:
                        break b;
                    }
                  }
                  g = J[(a + 40) >> 2];
                  J[g >> 2] = d;
                  J[(g + 4) >> 2] = l;
                  if ((f | 0) == 8) {
                    break a;
                  }
                  d = dc(J[(a + 32) >> 2]);
                  if ((d | 0) == -1) {
                    break a;
                  }
                  H[i | 0] = d;
                  f = (f + 1) | 0;
                  continue;
                }
                break;
              }
              H[(c + 23) | 0] = K[(c + 24) | 0];
            }
            e: {
              if (!b) {
                while (1) {
                  if ((f | 0) <= 0) {
                    break e;
                  }
                  f = (f - 1) | 0;
                  if (
                    (Hb(K[(f + ((c + 24) | 0)) | 0], J[(a + 32) >> 2]) | 0) !=
                    -1
                  ) {
                    continue;
                  }
                  break a;
                }
              }
              e = K[(c + 23) | 0];
              J[(a + 48) >> 2] = e;
              break a;
            }
            e = K[(c + 23) | 0];
          }
          ka = (c + 32) | 0;
          return e;
        }
        function Ee(a, b, c, d, e, f, g) {
          var h = 0,
            i = 0,
            j = 0,
            k = 0,
            l = 0,
            m = 0,
            n = 0,
            o = 0,
            p = 0;
          k = (ka - 16) | 0;
          ka = k;
          l = ib(g);
          g = Yb(g);
          oa[J[(J[g >> 2] + 20) >> 2]]((k + 4) | 0, g);
          i = H[(k + 15) | 0];
          a: {
            if (!((i | 0) < 0 ? J[(k + 8) >> 2] : i)) {
              oa[J[(J[l >> 2] + 48) >> 2]](l, a, c, d) | 0;
              g = (((c - a) << 2) + d) | 0;
              J[f >> 2] = g;
              break a;
            }
            J[f >> 2] = d;
            b: {
              c: {
                i = a;
                h = K[i | 0];
                switch ((h - 43) | 0) {
                  case 0:
                  case 2:
                    break c;
                  default:
                    break b;
                }
              }
              i = oa[J[(J[l >> 2] + 44) >> 2]](l, (h << 24) >> 24) | 0;
              h = J[f >> 2];
              J[f >> 2] = h + 4;
              J[h >> 2] = i;
              i = (a + 1) | 0;
            }
            if (
              !(
                (K[i | 0] != 48) |
                (((c - i) | 0) < 2) |
                ((K[(i + 1) | 0] | 32) != 120)
              )
            ) {
              h = oa[J[(J[l >> 2] + 44) >> 2]](l, 48) | 0;
              j = J[f >> 2];
              J[f >> 2] = j + 4;
              J[j >> 2] = h;
              h = oa[J[(J[l >> 2] + 44) >> 2]](l, H[(i + 1) | 0]) | 0;
              j = J[f >> 2];
              J[f >> 2] = j + 4;
              J[j >> 2] = h;
              i = (i + 2) | 0;
            }
            nc(i, c);
            p = oa[J[(J[g >> 2] + 16) >> 2]](g) | 0;
            j = 0;
            h = 0;
            g = i;
            while (1) {
              if (c >>> 0 <= g >>> 0) {
                Uc((((i - a) << 2) + d) | 0, J[f >> 2]);
                g = J[f >> 2];
              } else {
                n = J[(k + 4) >> 2];
                m = (k + 4) | 0;
                o = H[(k + 15) | 0] < 0;
                if (
                  !(
                    !K[((o ? n : m) + h) | 0] |
                    (H[((o ? n : m) + h) | 0] != (j | 0))
                  )
                ) {
                  j = J[f >> 2];
                  J[f >> 2] = j + 4;
                  J[j >> 2] = p;
                  j = 0;
                  m = h;
                  h = H[(k + 15) | 0];
                  h =
                    (m +
                      (m >>> 0 <
                        (((h | 0) < 0 ? J[(k + 8) >> 2] : h) - 1) >>> 0)) |
                    0;
                }
                n = oa[J[(J[l >> 2] + 44) >> 2]](l, H[g | 0]) | 0;
                m = J[f >> 2];
                J[f >> 2] = m + 4;
                J[m >> 2] = n;
                g = (g + 1) | 0;
                j = (j + 1) | 0;
                continue;
              }
              break;
            }
          }
          J[e >> 2] = (b | 0) == (c | 0) ? g : (((b - a) << 2) + d) | 0;
          ya((k + 4) | 0);
          ka = (k + 16) | 0;
        }
        function Ge(a, b, c, d, e, f, g) {
          var h = 0,
            i = 0,
            j = 0,
            k = 0,
            l = 0,
            m = 0,
            n = 0,
            o = 0,
            p = 0;
          k = (ka - 16) | 0;
          ka = k;
          l = eb(g);
          g = $b(g);
          oa[J[(J[g >> 2] + 20) >> 2]]((k + 4) | 0, g);
          i = H[(k + 15) | 0];
          a: {
            if (!((i | 0) < 0 ? J[(k + 8) >> 2] : i)) {
              oa[J[(J[l >> 2] + 32) >> 2]](l, a, c, d) | 0;
              g = (((c - a) | 0) + d) | 0;
              J[f >> 2] = g;
              break a;
            }
            J[f >> 2] = d;
            b: {
              c: {
                i = a;
                h = K[i | 0];
                switch ((h - 43) | 0) {
                  case 0:
                  case 2:
                    break c;
                  default:
                    break b;
                }
              }
              i = oa[J[(J[l >> 2] + 28) >> 2]](l, (h << 24) >> 24) | 0;
              h = J[f >> 2];
              J[f >> 2] = h + 1;
              H[h | 0] = i;
              i = (a + 1) | 0;
            }
            if (
              !(
                (K[i | 0] != 48) |
                (((c - i) | 0) < 2) |
                ((K[(i + 1) | 0] | 32) != 120)
              )
            ) {
              h = oa[J[(J[l >> 2] + 28) >> 2]](l, 48) | 0;
              j = J[f >> 2];
              J[f >> 2] = j + 1;
              H[j | 0] = h;
              h = oa[J[(J[l >> 2] + 28) >> 2]](l, H[(i + 1) | 0]) | 0;
              j = J[f >> 2];
              J[f >> 2] = j + 1;
              H[j | 0] = h;
              i = (i + 2) | 0;
            }
            nc(i, c);
            p = oa[J[(J[g >> 2] + 16) >> 2]](g) | 0;
            j = 0;
            h = 0;
            g = i;
            while (1) {
              if (c >>> 0 <= g >>> 0) {
                nc((((i - a) | 0) + d) | 0, J[f >> 2]);
                g = J[f >> 2];
              } else {
                n = J[(k + 4) >> 2];
                m = (k + 4) | 0;
                o = H[(k + 15) | 0] < 0;
                if (
                  !(
                    !K[((o ? n : m) + h) | 0] |
                    (H[((o ? n : m) + h) | 0] != (j | 0))
                  )
                ) {
                  j = J[f >> 2];
                  J[f >> 2] = j + 1;
                  H[j | 0] = p;
                  j = 0;
                  m = h;
                  h = H[(k + 15) | 0];
                  h =
                    (m +
                      (m >>> 0 <
                        (((h | 0) < 0 ? J[(k + 8) >> 2] : h) - 1) >>> 0)) |
                    0;
                }
                n = oa[J[(J[l >> 2] + 28) >> 2]](l, H[g | 0]) | 0;
                m = J[f >> 2];
                J[f >> 2] = m + 1;
                H[m | 0] = n;
                g = (g + 1) | 0;
                j = (j + 1) | 0;
                continue;
              }
              break;
            }
          }
          J[e >> 2] = (b | 0) == (c | 0) ? g : (((b - a) | 0) + d) | 0;
          ya((k + 4) | 0);
          ka = (k + 16) | 0;
        }
        function Oi(a, b, c, d, e, f) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          f = f | 0;
          var g = 0,
            h = 0,
            i = 0;
          a = (ka - 336) | 0;
          ka = a;
          J[(a + 328) >> 2] = c;
          J[(a + 332) >> 2] = b;
          c = mb(d);
          g = Wb(d, (a + 208) | 0);
          Vb((a + 196) | 0, d, (a + 324) | 0);
          J[(a + 192) >> 2] = 0;
          J[(a + 184) >> 2] = 0;
          J[(a + 188) >> 2] = 0;
          b = (a + 184) | 0;
          Ba(b, 10);
          b = H[(a + 195) | 0] < 0 ? J[(a + 184) >> 2] : b;
          J[(a + 180) >> 2] = b;
          J[(a + 12) >> 2] = a + 16;
          J[(a + 8) >> 2] = 0;
          while (1) {
            a: {
              if (La((a + 332) | 0, (a + 328) | 0)) {
                break a;
              }
              d = H[(a + 195) | 0];
              d = (d | 0) < 0 ? J[(a + 188) >> 2] : d;
              if (J[(a + 180) >> 2] == ((d + b) | 0)) {
                b = (a + 184) | 0;
                Ba(b, d << 1);
                Ba(
                  b,
                  H[(a + 195) | 0] >= 0
                    ? 10
                    : ((J[(a + 192) >> 2] & 2147483647) - 1) | 0,
                );
                b = H[(a + 195) | 0] < 0 ? J[(a + 184) >> 2] : b;
                J[(a + 180) >> 2] = d + b;
              }
              if (
                Lb(
                  _a(J[(a + 332) >> 2]),
                  c,
                  b,
                  (a + 180) | 0,
                  (a + 8) | 0,
                  J[(a + 324) >> 2],
                  (a + 196) | 0,
                  (a + 16) | 0,
                  (a + 12) | 0,
                  g,
                )
              ) {
                break a;
              }
              cb(J[(a + 332) >> 2]);
              continue;
            }
            break;
          }
          d = H[(a + 207) | 0];
          b: {
            if (!((d | 0) < 0 ? J[(a + 200) >> 2] : d)) {
              break b;
            }
            d = J[(a + 12) >> 2];
            if (((d - ((a + 16) | 0)) | 0) > 159) {
              break b;
            }
            J[(a + 12) >> 2] = d + 4;
            J[d >> 2] = J[(a + 8) >> 2];
          }
          ((h = f), (i = Te(b, J[(a + 180) >> 2], e, c)), (J[h >> 2] = i));
          J[(f + 4) >> 2] = na;
          Va((a + 196) | 0, (a + 16) | 0, J[(a + 12) >> 2], e);
          if (La((a + 332) | 0, (a + 328) | 0)) {
            J[e >> 2] = J[e >> 2] | 2;
          }
          b = J[(a + 332) >> 2];
          ya((a + 184) | 0);
          ya((a + 196) | 0);
          ka = (a + 336) | 0;
          return b | 0;
        }
        function Li(a, b, c, d, e, f) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          f = f | 0;
          var g = 0,
            h = 0,
            i = 0;
          a = (ka - 336) | 0;
          ka = a;
          J[(a + 328) >> 2] = c;
          J[(a + 332) >> 2] = b;
          c = mb(d);
          g = Wb(d, (a + 208) | 0);
          Vb((a + 196) | 0, d, (a + 324) | 0);
          J[(a + 192) >> 2] = 0;
          J[(a + 184) >> 2] = 0;
          J[(a + 188) >> 2] = 0;
          b = (a + 184) | 0;
          Ba(b, 10);
          b = H[(a + 195) | 0] < 0 ? J[(a + 184) >> 2] : b;
          J[(a + 180) >> 2] = b;
          J[(a + 12) >> 2] = a + 16;
          J[(a + 8) >> 2] = 0;
          while (1) {
            a: {
              if (La((a + 332) | 0, (a + 328) | 0)) {
                break a;
              }
              d = H[(a + 195) | 0];
              d = (d | 0) < 0 ? J[(a + 188) >> 2] : d;
              if (J[(a + 180) >> 2] == ((d + b) | 0)) {
                b = (a + 184) | 0;
                Ba(b, d << 1);
                Ba(
                  b,
                  H[(a + 195) | 0] >= 0
                    ? 10
                    : ((J[(a + 192) >> 2] & 2147483647) - 1) | 0,
                );
                b = H[(a + 195) | 0] < 0 ? J[(a + 184) >> 2] : b;
                J[(a + 180) >> 2] = d + b;
              }
              if (
                Lb(
                  _a(J[(a + 332) >> 2]),
                  c,
                  b,
                  (a + 180) | 0,
                  (a + 8) | 0,
                  J[(a + 324) >> 2],
                  (a + 196) | 0,
                  (a + 16) | 0,
                  (a + 12) | 0,
                  g,
                )
              ) {
                break a;
              }
              cb(J[(a + 332) >> 2]);
              continue;
            }
            break;
          }
          d = H[(a + 207) | 0];
          b: {
            if (!((d | 0) < 0 ? J[(a + 200) >> 2] : d)) {
              break b;
            }
            d = J[(a + 12) >> 2];
            if (((d - ((a + 16) | 0)) | 0) > 159) {
              break b;
            }
            J[(a + 12) >> 2] = d + 4;
            J[d >> 2] = J[(a + 8) >> 2];
          }
          ((h = f), (i = Pe(b, J[(a + 180) >> 2], e, c)), (J[h >> 2] = i));
          J[(f + 4) >> 2] = na;
          Va((a + 196) | 0, (a + 16) | 0, J[(a + 12) >> 2], e);
          if (La((a + 332) | 0, (a + 328) | 0)) {
            J[e >> 2] = J[e >> 2] | 2;
          }
          b = J[(a + 332) >> 2];
          ya((a + 184) | 0);
          ya((a + 196) | 0);
          ka = (a + 336) | 0;
          return b | 0;
        }
        function Yi(a, b, c, d, e, f) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          f = f | 0;
          var g = 0,
            h = 0;
          a = (ka - 224) | 0;
          ka = a;
          J[(a + 216) >> 2] = c;
          J[(a + 220) >> 2] = b;
          c = mb(d);
          Zb((a + 200) | 0, d, (a + 215) | 0);
          J[(a + 192) >> 2] = 0;
          J[(a + 184) >> 2] = 0;
          J[(a + 188) >> 2] = 0;
          b = (a + 184) | 0;
          Ba(b, 10);
          b = H[(a + 195) | 0] < 0 ? J[(a + 184) >> 2] : b;
          J[(a + 180) >> 2] = b;
          J[(a + 12) >> 2] = a + 16;
          J[(a + 8) >> 2] = 0;
          while (1) {
            a: {
              if (Ma((a + 220) | 0, (a + 216) | 0)) {
                break a;
              }
              d = H[(a + 195) | 0];
              d = (d | 0) < 0 ? J[(a + 188) >> 2] : d;
              if (J[(a + 180) >> 2] == ((d + b) | 0)) {
                b = (a + 184) | 0;
                Ba(b, d << 1);
                Ba(
                  b,
                  H[(a + 195) | 0] >= 0
                    ? 10
                    : ((J[(a + 192) >> 2] & 2147483647) - 1) | 0,
                );
                b = H[(a + 195) | 0] < 0 ? J[(a + 184) >> 2] : b;
                J[(a + 180) >> 2] = d + b;
              }
              if (
                Mb(
                  ($a(J[(a + 220) >> 2]) << 24) >> 24,
                  c,
                  b,
                  (a + 180) | 0,
                  (a + 8) | 0,
                  H[(a + 215) | 0],
                  (a + 200) | 0,
                  (a + 16) | 0,
                  (a + 12) | 0,
                  7520,
                )
              ) {
                break a;
              }
              db(J[(a + 220) >> 2]);
              continue;
            }
            break;
          }
          d = H[(a + 211) | 0];
          b: {
            if (!((d | 0) < 0 ? J[(a + 204) >> 2] : d)) {
              break b;
            }
            d = J[(a + 12) >> 2];
            if (((d - ((a + 16) | 0)) | 0) > 159) {
              break b;
            }
            J[(a + 12) >> 2] = d + 4;
            J[d >> 2] = J[(a + 8) >> 2];
          }
          ((g = f), (h = Te(b, J[(a + 180) >> 2], e, c)), (J[g >> 2] = h));
          J[(f + 4) >> 2] = na;
          Va((a + 200) | 0, (a + 16) | 0, J[(a + 12) >> 2], e);
          if (Ma((a + 220) | 0, (a + 216) | 0)) {
            J[e >> 2] = J[e >> 2] | 2;
          }
          b = J[(a + 220) >> 2];
          ya((a + 184) | 0);
          ya((a + 200) | 0);
          ka = (a + 224) | 0;
          return b | 0;
        }
        function Wi(a, b, c, d, e, f) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          f = f | 0;
          var g = 0,
            h = 0;
          a = (ka - 224) | 0;
          ka = a;
          J[(a + 216) >> 2] = c;
          J[(a + 220) >> 2] = b;
          c = mb(d);
          Zb((a + 200) | 0, d, (a + 215) | 0);
          J[(a + 192) >> 2] = 0;
          J[(a + 184) >> 2] = 0;
          J[(a + 188) >> 2] = 0;
          b = (a + 184) | 0;
          Ba(b, 10);
          b = H[(a + 195) | 0] < 0 ? J[(a + 184) >> 2] : b;
          J[(a + 180) >> 2] = b;
          J[(a + 12) >> 2] = a + 16;
          J[(a + 8) >> 2] = 0;
          while (1) {
            a: {
              if (Ma((a + 220) | 0, (a + 216) | 0)) {
                break a;
              }
              d = H[(a + 195) | 0];
              d = (d | 0) < 0 ? J[(a + 188) >> 2] : d;
              if (J[(a + 180) >> 2] == ((d + b) | 0)) {
                b = (a + 184) | 0;
                Ba(b, d << 1);
                Ba(
                  b,
                  H[(a + 195) | 0] >= 0
                    ? 10
                    : ((J[(a + 192) >> 2] & 2147483647) - 1) | 0,
                );
                b = H[(a + 195) | 0] < 0 ? J[(a + 184) >> 2] : b;
                J[(a + 180) >> 2] = d + b;
              }
              if (
                Mb(
                  ($a(J[(a + 220) >> 2]) << 24) >> 24,
                  c,
                  b,
                  (a + 180) | 0,
                  (a + 8) | 0,
                  H[(a + 215) | 0],
                  (a + 200) | 0,
                  (a + 16) | 0,
                  (a + 12) | 0,
                  7520,
                )
              ) {
                break a;
              }
              db(J[(a + 220) >> 2]);
              continue;
            }
            break;
          }
          d = H[(a + 211) | 0];
          b: {
            if (!((d | 0) < 0 ? J[(a + 204) >> 2] : d)) {
              break b;
            }
            d = J[(a + 12) >> 2];
            if (((d - ((a + 16) | 0)) | 0) > 159) {
              break b;
            }
            J[(a + 12) >> 2] = d + 4;
            J[d >> 2] = J[(a + 8) >> 2];
          }
          ((g = f), (h = Pe(b, J[(a + 180) >> 2], e, c)), (J[g >> 2] = h));
          J[(f + 4) >> 2] = na;
          Va((a + 200) | 0, (a + 16) | 0, J[(a + 12) >> 2], e);
          if (Ma((a + 220) | 0, (a + 216) | 0)) {
            J[e >> 2] = J[e >> 2] | 2;
          }
          b = J[(a + 220) >> 2];
          ya((a + 184) | 0);
          ya((a + 200) | 0);
          ka = (a + 224) | 0;
          return b | 0;
        }
        function Pi(a, b, c, d, e, f) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          f = f | 0;
          var g = 0,
            h = 0,
            i = 0;
          a = (ka - 336) | 0;
          ka = a;
          J[(a + 328) >> 2] = c;
          J[(a + 332) >> 2] = b;
          c = mb(d);
          g = Wb(d, (a + 208) | 0);
          Vb((a + 196) | 0, d, (a + 324) | 0);
          J[(a + 192) >> 2] = 0;
          J[(a + 184) >> 2] = 0;
          J[(a + 188) >> 2] = 0;
          b = (a + 184) | 0;
          Ba(b, 10);
          b = H[(a + 195) | 0] < 0 ? J[(a + 184) >> 2] : b;
          J[(a + 180) >> 2] = b;
          J[(a + 12) >> 2] = a + 16;
          J[(a + 8) >> 2] = 0;
          while (1) {
            a: {
              if (La((a + 332) | 0, (a + 328) | 0)) {
                break a;
              }
              d = H[(a + 195) | 0];
              d = (d | 0) < 0 ? J[(a + 188) >> 2] : d;
              if (J[(a + 180) >> 2] == ((d + b) | 0)) {
                b = (a + 184) | 0;
                Ba(b, d << 1);
                Ba(
                  b,
                  H[(a + 195) | 0] >= 0
                    ? 10
                    : ((J[(a + 192) >> 2] & 2147483647) - 1) | 0,
                );
                b = H[(a + 195) | 0] < 0 ? J[(a + 184) >> 2] : b;
                J[(a + 180) >> 2] = d + b;
              }
              if (
                Lb(
                  _a(J[(a + 332) >> 2]),
                  c,
                  b,
                  (a + 180) | 0,
                  (a + 8) | 0,
                  J[(a + 324) >> 2],
                  (a + 196) | 0,
                  (a + 16) | 0,
                  (a + 12) | 0,
                  g,
                )
              ) {
                break a;
              }
              cb(J[(a + 332) >> 2]);
              continue;
            }
            break;
          }
          d = H[(a + 207) | 0];
          b: {
            if (!((d | 0) < 0 ? J[(a + 200) >> 2] : d)) {
              break b;
            }
            d = J[(a + 12) >> 2];
            if (((d - ((a + 16) | 0)) | 0) > 159) {
              break b;
            }
            J[(a + 12) >> 2] = d + 4;
            J[d >> 2] = J[(a + 8) >> 2];
          }
          ((h = f), (i = Ve(b, J[(a + 180) >> 2], e, c)), (J[h >> 2] = i));
          Va((a + 196) | 0, (a + 16) | 0, J[(a + 12) >> 2], e);
          if (La((a + 332) | 0, (a + 328) | 0)) {
            J[e >> 2] = J[e >> 2] | 2;
          }
          b = J[(a + 332) >> 2];
          ya((a + 184) | 0);
          ya((a + 196) | 0);
          ka = (a + 336) | 0;
          return b | 0;
        }
        function Mi(a, b, c, d, e, f) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          f = f | 0;
          var g = 0,
            h = 0,
            i = 0;
          a = (ka - 336) | 0;
          ka = a;
          J[(a + 328) >> 2] = c;
          J[(a + 332) >> 2] = b;
          c = mb(d);
          g = Wb(d, (a + 208) | 0);
          Vb((a + 196) | 0, d, (a + 324) | 0);
          J[(a + 192) >> 2] = 0;
          J[(a + 184) >> 2] = 0;
          J[(a + 188) >> 2] = 0;
          b = (a + 184) | 0;
          Ba(b, 10);
          b = H[(a + 195) | 0] < 0 ? J[(a + 184) >> 2] : b;
          J[(a + 180) >> 2] = b;
          J[(a + 12) >> 2] = a + 16;
          J[(a + 8) >> 2] = 0;
          while (1) {
            a: {
              if (La((a + 332) | 0, (a + 328) | 0)) {
                break a;
              }
              d = H[(a + 195) | 0];
              d = (d | 0) < 0 ? J[(a + 188) >> 2] : d;
              if (J[(a + 180) >> 2] == ((d + b) | 0)) {
                b = (a + 184) | 0;
                Ba(b, d << 1);
                Ba(
                  b,
                  H[(a + 195) | 0] >= 0
                    ? 10
                    : ((J[(a + 192) >> 2] & 2147483647) - 1) | 0,
                );
                b = H[(a + 195) | 0] < 0 ? J[(a + 184) >> 2] : b;
                J[(a + 180) >> 2] = d + b;
              }
              if (
                Lb(
                  _a(J[(a + 332) >> 2]),
                  c,
                  b,
                  (a + 180) | 0,
                  (a + 8) | 0,
                  J[(a + 324) >> 2],
                  (a + 196) | 0,
                  (a + 16) | 0,
                  (a + 12) | 0,
                  g,
                )
              ) {
                break a;
              }
              cb(J[(a + 332) >> 2]);
              continue;
            }
            break;
          }
          d = H[(a + 207) | 0];
          b: {
            if (!((d | 0) < 0 ? J[(a + 200) >> 2] : d)) {
              break b;
            }
            d = J[(a + 12) >> 2];
            if (((d - ((a + 16) | 0)) | 0) > 159) {
              break b;
            }
            J[(a + 12) >> 2] = d + 4;
            J[d >> 2] = J[(a + 8) >> 2];
          }
          ((h = f), (i = Se(b, J[(a + 180) >> 2], e, c)), (I[h >> 1] = i));
          Va((a + 196) | 0, (a + 16) | 0, J[(a + 12) >> 2], e);
          if (La((a + 332) | 0, (a + 328) | 0)) {
            J[e >> 2] = J[e >> 2] | 2;
          }
          b = J[(a + 332) >> 2];
          ya((a + 184) | 0);
          ya((a + 196) | 0);
          ka = (a + 336) | 0;
          return b | 0;
        }
        function Je(a, b, c, d, e, f) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          f = f | 0;
          var g = 0,
            h = 0,
            i = 0;
          a = (ka - 336) | 0;
          ka = a;
          J[(a + 328) >> 2] = c;
          J[(a + 332) >> 2] = b;
          c = mb(d);
          g = Wb(d, (a + 208) | 0);
          Vb((a + 196) | 0, d, (a + 324) | 0);
          J[(a + 192) >> 2] = 0;
          J[(a + 184) >> 2] = 0;
          J[(a + 188) >> 2] = 0;
          b = (a + 184) | 0;
          Ba(b, 10);
          b = H[(a + 195) | 0] < 0 ? J[(a + 184) >> 2] : b;
          J[(a + 180) >> 2] = b;
          J[(a + 12) >> 2] = a + 16;
          J[(a + 8) >> 2] = 0;
          while (1) {
            a: {
              if (La((a + 332) | 0, (a + 328) | 0)) {
                break a;
              }
              d = H[(a + 195) | 0];
              d = (d | 0) < 0 ? J[(a + 188) >> 2] : d;
              if (J[(a + 180) >> 2] == ((d + b) | 0)) {
                b = (a + 184) | 0;
                Ba(b, d << 1);
                Ba(
                  b,
                  H[(a + 195) | 0] >= 0
                    ? 10
                    : ((J[(a + 192) >> 2] & 2147483647) - 1) | 0,
                );
                b = H[(a + 195) | 0] < 0 ? J[(a + 184) >> 2] : b;
                J[(a + 180) >> 2] = d + b;
              }
              if (
                Lb(
                  _a(J[(a + 332) >> 2]),
                  c,
                  b,
                  (a + 180) | 0,
                  (a + 8) | 0,
                  J[(a + 324) >> 2],
                  (a + 196) | 0,
                  (a + 16) | 0,
                  (a + 12) | 0,
                  g,
                )
              ) {
                break a;
              }
              cb(J[(a + 332) >> 2]);
              continue;
            }
            break;
          }
          d = H[(a + 207) | 0];
          b: {
            if (!((d | 0) < 0 ? J[(a + 200) >> 2] : d)) {
              break b;
            }
            d = J[(a + 12) >> 2];
            if (((d - ((a + 16) | 0)) | 0) > 159) {
              break b;
            }
            J[(a + 12) >> 2] = d + 4;
            J[d >> 2] = J[(a + 8) >> 2];
          }
          ((h = f), (i = Qe(b, J[(a + 180) >> 2], e, c)), (J[h >> 2] = i));
          Va((a + 196) | 0, (a + 16) | 0, J[(a + 12) >> 2], e);
          if (La((a + 332) | 0, (a + 328) | 0)) {
            J[e >> 2] = J[e >> 2] | 2;
          }
          b = J[(a + 332) >> 2];
          ya((a + 184) | 0);
          ya((a + 196) | 0);
          ka = (a + 336) | 0;
          return b | 0;
        }
        function Ri(a, b, c, d, e, f) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          f = f | 0;
          var g = 0;
          a = (ka - 272) | 0;
          ka = a;
          J[(a + 264) >> 2] = c;
          J[(a + 268) >> 2] = b;
          J[(a + 216) >> 2] = 0;
          J[(a + 208) >> 2] = 0;
          J[(a + 212) >> 2] = 0;
          b = (a + 16) | 0;
          Ha(b, d);
          c = eb(b);
          oa[J[(J[c >> 2] + 32) >> 2]](c, 7520, 7546, (a + 224) | 0) | 0;
          Ka(J[(a + 16) >> 2]);
          J[(a + 200) >> 2] = 0;
          J[(a + 192) >> 2] = 0;
          J[(a + 196) >> 2] = 0;
          c = (a + 192) | 0;
          Ba(c, 10);
          c = H[(a + 203) | 0] < 0 ? J[(a + 192) >> 2] : c;
          J[(a + 188) >> 2] = c;
          J[(a + 12) >> 2] = b;
          J[(a + 8) >> 2] = 0;
          while (1) {
            a: {
              if (Ma((a + 268) | 0, (a + 264) | 0)) {
                break a;
              }
              b = H[(a + 203) | 0];
              b = (b | 0) < 0 ? J[(a + 196) >> 2] : b;
              if (J[(a + 188) >> 2] == ((b + c) | 0)) {
                c = (a + 192) | 0;
                Ba(c, b << 1);
                Ba(
                  c,
                  H[(a + 203) | 0] >= 0
                    ? 10
                    : ((J[(a + 200) >> 2] & 2147483647) - 1) | 0,
                );
                c = H[(a + 203) | 0] < 0 ? J[(a + 192) >> 2] : c;
                J[(a + 188) >> 2] = b + c;
              }
              if (
                Mb(
                  ($a(J[(a + 268) >> 2]) << 24) >> 24,
                  16,
                  c,
                  (a + 188) | 0,
                  (a + 8) | 0,
                  0,
                  (a + 208) | 0,
                  (a + 16) | 0,
                  (a + 12) | 0,
                  (a + 224) | 0,
                )
              ) {
                break a;
              }
              db(J[(a + 268) >> 2]);
              continue;
            }
            break;
          }
          b = (a + 192) | 0;
          Ba(b, (J[(a + 188) >> 2] - c) | 0);
          c = J[(a + 192) >> 2];
          d = H[(a + 203) | 0];
          g = Xa();
          J[a >> 2] = f;
          if ((Le((d | 0) < 0 ? c : b, g, a) | 0) != 1) {
            J[e >> 2] = 4;
          }
          if (Ma((a + 268) | 0, (a + 264) | 0)) {
            J[e >> 2] = J[e >> 2] | 2;
          }
          b = J[(a + 268) >> 2];
          ya((a + 192) | 0);
          ya((a + 208) | 0);
          ka = (a + 272) | 0;
          return b | 0;
        }
        function Zi(a, b, c, d, e, f) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          f = f | 0;
          var g = 0,
            h = 0;
          a = (ka - 224) | 0;
          ka = a;
          J[(a + 216) >> 2] = c;
          J[(a + 220) >> 2] = b;
          c = mb(d);
          Zb((a + 200) | 0, d, (a + 215) | 0);
          J[(a + 192) >> 2] = 0;
          J[(a + 184) >> 2] = 0;
          J[(a + 188) >> 2] = 0;
          b = (a + 184) | 0;
          Ba(b, 10);
          b = H[(a + 195) | 0] < 0 ? J[(a + 184) >> 2] : b;
          J[(a + 180) >> 2] = b;
          J[(a + 12) >> 2] = a + 16;
          J[(a + 8) >> 2] = 0;
          while (1) {
            a: {
              if (Ma((a + 220) | 0, (a + 216) | 0)) {
                break a;
              }
              d = H[(a + 195) | 0];
              d = (d | 0) < 0 ? J[(a + 188) >> 2] : d;
              if (J[(a + 180) >> 2] == ((d + b) | 0)) {
                b = (a + 184) | 0;
                Ba(b, d << 1);
                Ba(
                  b,
                  H[(a + 195) | 0] >= 0
                    ? 10
                    : ((J[(a + 192) >> 2] & 2147483647) - 1) | 0,
                );
                b = H[(a + 195) | 0] < 0 ? J[(a + 184) >> 2] : b;
                J[(a + 180) >> 2] = d + b;
              }
              if (
                Mb(
                  ($a(J[(a + 220) >> 2]) << 24) >> 24,
                  c,
                  b,
                  (a + 180) | 0,
                  (a + 8) | 0,
                  H[(a + 215) | 0],
                  (a + 200) | 0,
                  (a + 16) | 0,
                  (a + 12) | 0,
                  7520,
                )
              ) {
                break a;
              }
              db(J[(a + 220) >> 2]);
              continue;
            }
            break;
          }
          d = H[(a + 211) | 0];
          b: {
            if (!((d | 0) < 0 ? J[(a + 204) >> 2] : d)) {
              break b;
            }
            d = J[(a + 12) >> 2];
            if (((d - ((a + 16) | 0)) | 0) > 159) {
              break b;
            }
            J[(a + 12) >> 2] = d + 4;
            J[d >> 2] = J[(a + 8) >> 2];
          }
          ((g = f), (h = Ve(b, J[(a + 180) >> 2], e, c)), (J[g >> 2] = h));
          Va((a + 200) | 0, (a + 16) | 0, J[(a + 12) >> 2], e);
          if (Ma((a + 220) | 0, (a + 216) | 0)) {
            J[e >> 2] = J[e >> 2] | 2;
          }
          b = J[(a + 220) >> 2];
          ya((a + 184) | 0);
          ya((a + 200) | 0);
          ka = (a + 224) | 0;
          return b | 0;
        }
        function Xi(a, b, c, d, e, f) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          f = f | 0;
          var g = 0,
            h = 0;
          a = (ka - 224) | 0;
          ka = a;
          J[(a + 216) >> 2] = c;
          J[(a + 220) >> 2] = b;
          c = mb(d);
          Zb((a + 200) | 0, d, (a + 215) | 0);
          J[(a + 192) >> 2] = 0;
          J[(a + 184) >> 2] = 0;
          J[(a + 188) >> 2] = 0;
          b = (a + 184) | 0;
          Ba(b, 10);
          b = H[(a + 195) | 0] < 0 ? J[(a + 184) >> 2] : b;
          J[(a + 180) >> 2] = b;
          J[(a + 12) >> 2] = a + 16;
          J[(a + 8) >> 2] = 0;
          while (1) {
            a: {
              if (Ma((a + 220) | 0, (a + 216) | 0)) {
                break a;
              }
              d = H[(a + 195) | 0];
              d = (d | 0) < 0 ? J[(a + 188) >> 2] : d;
              if (J[(a + 180) >> 2] == ((d + b) | 0)) {
                b = (a + 184) | 0;
                Ba(b, d << 1);
                Ba(
                  b,
                  H[(a + 195) | 0] >= 0
                    ? 10
                    : ((J[(a + 192) >> 2] & 2147483647) - 1) | 0,
                );
                b = H[(a + 195) | 0] < 0 ? J[(a + 184) >> 2] : b;
                J[(a + 180) >> 2] = d + b;
              }
              if (
                Mb(
                  ($a(J[(a + 220) >> 2]) << 24) >> 24,
                  c,
                  b,
                  (a + 180) | 0,
                  (a + 8) | 0,
                  H[(a + 215) | 0],
                  (a + 200) | 0,
                  (a + 16) | 0,
                  (a + 12) | 0,
                  7520,
                )
              ) {
                break a;
              }
              db(J[(a + 220) >> 2]);
              continue;
            }
            break;
          }
          d = H[(a + 211) | 0];
          b: {
            if (!((d | 0) < 0 ? J[(a + 204) >> 2] : d)) {
              break b;
            }
            d = J[(a + 12) >> 2];
            if (((d - ((a + 16) | 0)) | 0) > 159) {
              break b;
            }
            J[(a + 12) >> 2] = d + 4;
            J[d >> 2] = J[(a + 8) >> 2];
          }
          ((g = f), (h = Se(b, J[(a + 180) >> 2], e, c)), (I[g >> 1] = h));
          Va((a + 200) | 0, (a + 16) | 0, J[(a + 12) >> 2], e);
          if (Ma((a + 220) | 0, (a + 216) | 0)) {
            J[e >> 2] = J[e >> 2] | 2;
          }
          b = J[(a + 220) >> 2];
          ya((a + 184) | 0);
          ya((a + 200) | 0);
          ka = (a + 224) | 0;
          return b | 0;
        }
        function Re(a, b, c, d, e, f) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          f = f | 0;
          var g = 0,
            h = 0;
          a = (ka - 224) | 0;
          ka = a;
          J[(a + 216) >> 2] = c;
          J[(a + 220) >> 2] = b;
          c = mb(d);
          Zb((a + 200) | 0, d, (a + 215) | 0);
          J[(a + 192) >> 2] = 0;
          J[(a + 184) >> 2] = 0;
          J[(a + 188) >> 2] = 0;
          b = (a + 184) | 0;
          Ba(b, 10);
          b = H[(a + 195) | 0] < 0 ? J[(a + 184) >> 2] : b;
          J[(a + 180) >> 2] = b;
          J[(a + 12) >> 2] = a + 16;
          J[(a + 8) >> 2] = 0;
          while (1) {
            a: {
              if (Ma((a + 220) | 0, (a + 216) | 0)) {
                break a;
              }
              d = H[(a + 195) | 0];
              d = (d | 0) < 0 ? J[(a + 188) >> 2] : d;
              if (J[(a + 180) >> 2] == ((d + b) | 0)) {
                b = (a + 184) | 0;
                Ba(b, d << 1);
                Ba(
                  b,
                  H[(a + 195) | 0] >= 0
                    ? 10
                    : ((J[(a + 192) >> 2] & 2147483647) - 1) | 0,
                );
                b = H[(a + 195) | 0] < 0 ? J[(a + 184) >> 2] : b;
                J[(a + 180) >> 2] = d + b;
              }
              if (
                Mb(
                  ($a(J[(a + 220) >> 2]) << 24) >> 24,
                  c,
                  b,
                  (a + 180) | 0,
                  (a + 8) | 0,
                  H[(a + 215) | 0],
                  (a + 200) | 0,
                  (a + 16) | 0,
                  (a + 12) | 0,
                  7520,
                )
              ) {
                break a;
              }
              db(J[(a + 220) >> 2]);
              continue;
            }
            break;
          }
          d = H[(a + 211) | 0];
          b: {
            if (!((d | 0) < 0 ? J[(a + 204) >> 2] : d)) {
              break b;
            }
            d = J[(a + 12) >> 2];
            if (((d - ((a + 16) | 0)) | 0) > 159) {
              break b;
            }
            J[(a + 12) >> 2] = d + 4;
            J[d >> 2] = J[(a + 8) >> 2];
          }
          ((g = f), (h = Qe(b, J[(a + 180) >> 2], e, c)), (J[g >> 2] = h));
          Va((a + 200) | 0, (a + 16) | 0, J[(a + 12) >> 2], e);
          if (Ma((a + 220) | 0, (a + 216) | 0)) {
            J[e >> 2] = J[e >> 2] | 2;
          }
          b = J[(a + 220) >> 2];
          ya((a + 184) | 0);
          ya((a + 200) | 0);
          ka = (a + 224) | 0;
          return b | 0;
        }
        function be(a, b, c, d, e, f, g, h) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          f = f | 0;
          g = g | 0;
          h = h | 0;
          a = (ka - 16) | 0;
          ka = a;
          J[(a + 12) >> 2] = c;
          J[(a + 8) >> 2] = f;
          a: {
            b: {
              while (1) {
                c: {
                  if (c >>> 0 >= d >>> 0) {
                    f = 0;
                    break c;
                  }
                  f = 2;
                  b = J[c >> 2];
                  if ((b >>> 0 > 1114111) | ((b & -2048) == 55296)) {
                    break c;
                  }
                  d: {
                    if (b >>> 0 <= 127) {
                      f = 1;
                      c = J[(a + 8) >> 2];
                      if (((g - c) | 0) <= 0) {
                        break c;
                      }
                      J[(a + 8) >> 2] = c + 1;
                      H[c | 0] = b;
                      break d;
                    }
                    if (b >>> 0 <= 2047) {
                      c = J[(a + 8) >> 2];
                      if (((g - c) | 0) < 2) {
                        break b;
                      }
                      J[(a + 8) >> 2] = c + 1;
                      H[c | 0] = (b >>> 6) | 192;
                      c = J[(a + 8) >> 2];
                      J[(a + 8) >> 2] = c + 1;
                      H[c | 0] = (b & 63) | 128;
                      break d;
                    }
                    c = J[(a + 8) >> 2];
                    f = (g - c) | 0;
                    if (b >>> 0 <= 65535) {
                      if ((f | 0) < 3) {
                        break b;
                      }
                      J[(a + 8) >> 2] = c + 1;
                      H[c | 0] = (b >>> 12) | 224;
                      c = J[(a + 8) >> 2];
                      J[(a + 8) >> 2] = c + 1;
                      H[c | 0] = ((b >>> 6) & 63) | 128;
                      c = J[(a + 8) >> 2];
                      J[(a + 8) >> 2] = c + 1;
                      H[c | 0] = (b & 63) | 128;
                      break d;
                    }
                    if ((f | 0) < 4) {
                      break b;
                    }
                    J[(a + 8) >> 2] = c + 1;
                    H[c | 0] = (b >>> 18) | 240;
                    c = J[(a + 8) >> 2];
                    J[(a + 8) >> 2] = c + 1;
                    H[c | 0] = ((b >>> 12) & 63) | 128;
                    c = J[(a + 8) >> 2];
                    J[(a + 8) >> 2] = c + 1;
                    H[c | 0] = ((b >>> 6) & 63) | 128;
                    c = J[(a + 8) >> 2];
                    J[(a + 8) >> 2] = c + 1;
                    H[c | 0] = (b & 63) | 128;
                  }
                  c = (J[(a + 12) >> 2] + 4) | 0;
                  J[(a + 12) >> 2] = c;
                  continue;
                }
                break;
              }
              break a;
            }
            f = 1;
          }
          J[e >> 2] = J[(a + 12) >> 2];
          J[h >> 2] = J[(a + 8) >> 2];
          ka = (a + 16) | 0;
          return f | 0;
        }
        function Hi(a, b, c, d, e, f) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          f = f | 0;
          var g = 0;
          a = (ka - 336) | 0;
          ka = a;
          J[(a + 328) >> 2] = c;
          J[(a + 332) >> 2] = b;
          J[(a + 216) >> 2] = 0;
          J[(a + 208) >> 2] = 0;
          J[(a + 212) >> 2] = 0;
          b = (a + 16) | 0;
          Ha(b, d);
          c = ib(b);
          oa[J[(J[c >> 2] + 48) >> 2]](c, 7520, 7546, (a + 224) | 0) | 0;
          Ka(J[(a + 16) >> 2]);
          J[(a + 200) >> 2] = 0;
          J[(a + 192) >> 2] = 0;
          J[(a + 196) >> 2] = 0;
          c = (a + 192) | 0;
          Ba(c, 10);
          c = H[(a + 203) | 0] < 0 ? J[(a + 192) >> 2] : c;
          J[(a + 188) >> 2] = c;
          J[(a + 12) >> 2] = b;
          J[(a + 8) >> 2] = 0;
          while (1) {
            a: {
              if (La((a + 332) | 0, (a + 328) | 0)) {
                break a;
              }
              b = H[(a + 203) | 0];
              b = (b | 0) < 0 ? J[(a + 196) >> 2] : b;
              if (J[(a + 188) >> 2] == ((b + c) | 0)) {
                c = (a + 192) | 0;
                Ba(c, b << 1);
                Ba(
                  c,
                  H[(a + 203) | 0] >= 0
                    ? 10
                    : ((J[(a + 200) >> 2] & 2147483647) - 1) | 0,
                );
                c = H[(a + 203) | 0] < 0 ? J[(a + 192) >> 2] : c;
                J[(a + 188) >> 2] = b + c;
              }
              if (
                Lb(
                  _a(J[(a + 332) >> 2]),
                  16,
                  c,
                  (a + 188) | 0,
                  (a + 8) | 0,
                  0,
                  (a + 208) | 0,
                  (a + 16) | 0,
                  (a + 12) | 0,
                  (a + 224) | 0,
                )
              ) {
                break a;
              }
              cb(J[(a + 332) >> 2]);
              continue;
            }
            break;
          }
          b = (a + 192) | 0;
          Ba(b, (J[(a + 188) >> 2] - c) | 0);
          c = J[(a + 192) >> 2];
          d = H[(a + 203) | 0];
          g = Xa();
          J[a >> 2] = f;
          if ((Le((d | 0) < 0 ? c : b, g, a) | 0) != 1) {
            J[e >> 2] = 4;
          }
          if (La((a + 332) | 0, (a + 328) | 0)) {
            J[e >> 2] = J[e >> 2] | 2;
          }
          b = J[(a + 332) >> 2];
          ya((a + 192) | 0);
          ya((a + 208) | 0);
          ka = (a + 336) | 0;
          return b | 0;
        }
        function bk(a, b, c) {
          var d = 0,
            e = 0,
            f = 0,
            g = 0,
            h = 0,
            i = 0,
            j = 0,
            k = 0,
            l = 0;
          a: {
            b: {
              c: {
                d: {
                  e: {
                    f: {
                      g: {
                        h: {
                          i: {
                            if (b) {
                              if (!c) {
                                break i;
                              }
                              break h;
                            }
                            b = a;
                            a = ((a >>> 0) / (c >>> 0)) | 0;
                            la = (b - P(a, c)) | 0;
                            ma = 0;
                            na = 0;
                            return a;
                          }
                          if (!a) {
                            break g;
                          }
                          break f;
                        }
                        d = (c - 1) | 0;
                        if (!(d & c)) {
                          break e;
                        }
                        g = (((S(c) + 33) | 0) - S(b)) | 0;
                        f = (0 - g) | 0;
                        break c;
                      }
                      la = 0;
                      a = ((b >>> 0) / 0) | 0;
                      ma = (b - P(a, 0)) | 0;
                      na = 0;
                      return a;
                    }
                    d = (32 - S(b)) | 0;
                    if (d >>> 0 < 31) {
                      break d;
                    }
                    break b;
                  }
                  la = a & d;
                  ma = 0;
                  if ((c | 0) == 1) {
                    break a;
                  }
                  d = ck(c);
                  c = d & 31;
                  if ((d & 63) >>> 0 >= 32) {
                    a = (b >>> c) | 0;
                  } else {
                    e = (b >>> c) | 0;
                    a = ((((1 << c) - 1) & b) << (32 - c)) | (a >>> c);
                  }
                  na = e;
                  return a;
                }
                g = (d + 1) | 0;
                f = (63 - d) | 0;
              }
              e = g & 63;
              d = e & 31;
              if (e >>> 0 >= 32) {
                e = 0;
                h = (b >>> d) | 0;
              } else {
                e = (b >>> d) | 0;
                h = ((((1 << d) - 1) & b) << (32 - d)) | (a >>> d);
              }
              f = f & 63;
              d = f & 31;
              if (f >>> 0 >= 32) {
                b = a << d;
                a = 0;
              } else {
                b = (((1 << d) - 1) & (a >>> (32 - d))) | (b << d);
                a = a << d;
              }
              if (g) {
                d = (c - 1) | 0;
                k = (d | 0) == -1 ? -1 : 0;
                while (1) {
                  i = (e << 1) | (h >>> 31);
                  e = (h << 1) | (b >>> 31);
                  f = (k - ((i + (e >>> 0 > d >>> 0)) | 0)) >> 31;
                  j = c & f;
                  h = (e - j) | 0;
                  e = (i - (e >>> 0 < j >>> 0)) | 0;
                  b = (b << 1) | (a >>> 31);
                  a = l | (a << 1);
                  i = f & 1;
                  l = i;
                  g = (g - 1) | 0;
                  if (g) {
                    continue;
                  }
                  break;
                }
              }
              la = h;
              ma = e;
              na = (b << 1) | (a >>> 31);
              return i | (a << 1);
            }
            la = a;
            ma = b;
            a = 0;
            b = 0;
          }
          na = b;
          return a;
        }
        function _e(a, b, c, d) {
          var e = 0,
            f = 0,
            g = 0,
            h = 0,
            i = 0,
            j = 0;
          f = (ka - 32) | 0;
          ka = f;
          g = d & 65535;
          h = (d >>> 16) & 32767;
          j = h;
          a: {
            if ((h - 16257) >>> 0 <= 253) {
              e = ((g & 33554431) << 7) | (c >>> 25);
              g = 0;
              c = c & 33554431;
              b: {
                if (
                  !(!g & ((c | 0) == 16777216)
                    ? !(a | b)
                    : 1 & (c >>> 0 < 16777216))
                ) {
                  e = (e + 1) | 0;
                  break b;
                }
                if ((c ^ 16777216) | a | (b | g)) {
                  break b;
                }
                e = ((e & 1) + e) | 0;
              }
              a = e >>> 0 > 8388607;
              e = a ? 0 : e;
              a = (j + (a ? -16255 : -16256)) | 0;
              break a;
            }
            if (!(!(a | c | (b | g)) | (i | ((h | 0) != 32767)))) {
              e = ((g & 33554431) << 7) | (c >>> 25) | 4194304;
              a = 255;
              break a;
            }
            if (j >>> 0 > 16510) {
              a = 255;
              break a;
            }
            i = !(i | h);
            h = i ? 16256 : 16257;
            e = (h - j) | 0;
            if ((e | 0) > 112) {
              e = 0;
              a = 0;
              break a;
            }
            g = i ? g : g | 65536;
            i = 0;
            if ((h | 0) != (j | 0)) {
              Ta((f + 16) | 0, a, b, c, g, (128 - e) | 0);
              i =
                (J[(f + 16) >> 2] |
                  J[(f + 24) >> 2] |
                  (J[(f + 20) >> 2] | J[(f + 28) >> 2])) !=
                0;
            }
            Gb(f, a, b, c, g, e);
            a = J[(f + 8) >> 2];
            e = ((J[(f + 12) >> 2] & 33554431) << 7) | (a >>> 25);
            h = a & 33554431;
            a = i | J[f >> 2];
            c = J[(f + 4) >> 2];
            b = 0;
            c: {
              if (
                !(!b & ((h | 0) == 16777216)
                  ? !(a | c)
                  : 1 & (h >>> 0 < 16777216))
              ) {
                e = (e + 1) | 0;
                break c;
              }
              if ((h ^ 16777216) | a | (b | c)) {
                break c;
              }
              e = ((e & 1) + e) | 0;
            }
            a = e >>> 0 > 8388607;
            e = a ? e ^ 8388608 : e;
          }
          ka = (f + 32) | 0;
          return (u(2, (d & -2147483648) | (a << 23) | e), E());
        }
        function $d(a, b, c, d, e) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          var f = 0,
            g = 0,
            h = 0,
            i = 0;
          a = c;
          while (1) {
            a: {
              if ((e >>> 0 <= h >>> 0) | (a >>> 0 >= d >>> 0)) {
                break a;
              }
              b = H[a | 0];
              g = b & 255;
              f = 1;
              b: {
                if ((b | 0) >= 0) {
                  break b;
                }
                if (b >>> 0 < 4294967234) {
                  break a;
                }
                if (b >>> 0 <= 4294967263) {
                  if (((K[(a + 1) | 0] & 192) != 128) | (((d - a) | 0) < 2)) {
                    break a;
                  }
                  f = 2;
                  break b;
                }
                if (b >>> 0 <= 4294967279) {
                  if (((d - a) | 0) < 3) {
                    break a;
                  }
                  f = K[(a + 2) | 0];
                  b = H[(a + 1) | 0];
                  c: {
                    d: {
                      if ((g | 0) != 237) {
                        if ((g | 0) != 224) {
                          break d;
                        }
                        if ((b & -32) == -96) {
                          break c;
                        }
                        break a;
                      }
                      if ((b | 0) >= -96) {
                        break a;
                      }
                      break c;
                    }
                    if ((b | 0) > -65) {
                      break a;
                    }
                  }
                  if ((f & 192) != 128) {
                    break a;
                  }
                  f = 3;
                  break b;
                }
                if ((((d - a) | 0) < 4) | (b >>> 0 > 4294967284)) {
                  break a;
                }
                f = K[(a + 3) | 0];
                i = K[(a + 2) | 0];
                b = H[(a + 1) | 0];
                e: {
                  f: {
                    switch ((g - 240) | 0) {
                      case 0:
                        if (((b + 112) & 255) >>> 0 >= 48) {
                          break a;
                        }
                        break e;
                      case 4:
                        if ((b | 0) >= -112) {
                          break a;
                        }
                        break e;
                      default:
                        break f;
                    }
                  }
                  if ((b | 0) > -65) {
                    break a;
                  }
                }
                if (
                  ((i & 192) != 128) |
                  ((f & 192) != 128) |
                  (((f & 63) |
                    (((i << 6) & 4032) |
                      (((g << 18) & 1835008) | ((b & 63) << 12)))) >>>
                    0 >
                    1114111)
                ) {
                  break a;
                }
                f = 4;
              }
              h = (h + 1) | 0;
              a = (a + f) | 0;
              continue;
            }
            break;
          }
          return (a - c) | 0;
        }
        function ce(a, b, c, d, e) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          var f = 0,
            g = 0,
            h = 0,
            i = 0;
          a = c;
          while (1) {
            a: {
              if ((e >>> 0 <= g >>> 0) | (a >>> 0 >= d >>> 0)) {
                break a;
              }
              b = K[a | 0];
              f = (a + 1) | 0;
              b: {
                if ((b << 24) >> 24 >= 0) {
                  break b;
                }
                if (b >>> 0 < 194) {
                  break a;
                }
                if (b >>> 0 <= 223) {
                  if (((K[(a + 1) | 0] & 192) != 128) | (((d - a) | 0) < 2)) {
                    break a;
                  }
                  f = (a + 2) | 0;
                  break b;
                }
                if (b >>> 0 <= 239) {
                  if (((d - a) | 0) < 3) {
                    break a;
                  }
                  h = K[(a + 2) | 0];
                  f = H[(a + 1) | 0];
                  c: {
                    d: {
                      if ((b | 0) != 237) {
                        if ((b | 0) != 224) {
                          break d;
                        }
                        if ((f & -32) == -96) {
                          break c;
                        }
                        break a;
                      }
                      if ((f | 0) >= -96) {
                        break a;
                      }
                      break c;
                    }
                    if ((f | 0) > -65) {
                      break a;
                    }
                  }
                  if ((h & 192) != 128) {
                    break a;
                  }
                  f = (a + 3) | 0;
                  break b;
                }
                if (
                  (((d - a) | 0) < 4) |
                  (b >>> 0 > 244) |
                  ((e - g) >>> 0 < 2)
                ) {
                  break a;
                }
                h = K[(a + 3) | 0];
                i = K[(a + 2) | 0];
                f = H[(a + 1) | 0];
                e: {
                  f: {
                    switch ((b - 240) | 0) {
                      case 0:
                        if (((f + 112) & 255) >>> 0 >= 48) {
                          break a;
                        }
                        break e;
                      case 4:
                        if ((f | 0) >= -112) {
                          break a;
                        }
                        break e;
                      default:
                        break f;
                    }
                  }
                  if ((f | 0) > -65) {
                    break a;
                  }
                }
                if (
                  ((i & 192) != 128) |
                  ((h & 192) != 128) |
                  (((h & 63) |
                    (((i << 6) & 4032) |
                      (((b << 18) & 1835008) | ((f & 63) << 12)))) >>>
                    0 >
                    1114111)
                ) {
                  break a;
                }
                g = (g + 1) | 0;
                f = (a + 4) | 0;
              }
              a = f;
              g = (g + 1) | 0;
              continue;
            }
            break;
          }
          return (a - c) | 0;
        }
        function Me(a, b, c, d) {
          var e = 0,
            f = 0,
            g = 0,
            h = 0,
            i = 0,
            j = 0,
            k = 0,
            l = 0,
            m = 0,
            n = 0,
            o = 0;
          i = (ka - 32) | 0;
          ka = i;
          a: {
            b: {
              c: {
                if ((b | 0) != (c | 0)) {
                  k = J[4158];
                  J[4158] = 0;
                  g = (ka - 16) | 0;
                  ka = g;
                  Xa();
                  f = (ka - 16) | 0;
                  ka = f;
                  e = (ka - 16) | 0;
                  ka = e;
                  ad(e, b, (i + 28) | 0, 2);
                  h = J[e >> 2];
                  j = J[(e + 4) >> 2];
                  b = f;
                  f = J[(e + 12) >> 2];
                  J[(b + 8) >> 2] = J[(e + 8) >> 2];
                  J[(b + 12) >> 2] = f;
                  J[b >> 2] = h;
                  J[(b + 4) >> 2] = j;
                  ka = (e + 16) | 0;
                  f = J[b >> 2];
                  h = J[(b + 4) >> 2];
                  e = g;
                  g = J[(b + 12) >> 2];
                  J[(e + 8) >> 2] = J[(b + 8) >> 2];
                  J[(e + 12) >> 2] = g;
                  J[e >> 2] = f;
                  J[(e + 4) >> 2] = h;
                  ka = (b + 16) | 0;
                  g = J[e >> 2];
                  f = J[(e + 4) >> 2];
                  h = J[(e + 12) >> 2];
                  b = i;
                  J[(b + 16) >> 2] = J[(e + 8) >> 2];
                  J[(b + 20) >> 2] = h;
                  J[(b + 8) >> 2] = g;
                  J[(b + 12) >> 2] = f;
                  ka = (e + 16) | 0;
                  e = J[(b + 16) >> 2];
                  f = J[(b + 20) >> 2];
                  g = J[(b + 8) >> 2];
                  h = J[(b + 12) >> 2];
                  j = J[4158];
                  if (!j) {
                    break c;
                  }
                  if (J[(b + 28) >> 2] != (c | 0)) {
                    break b;
                  }
                  l = g;
                  m = h;
                  n = e;
                  o = f;
                  if ((j | 0) != 68) {
                    break a;
                  }
                  break b;
                }
                J[d >> 2] = 4;
                break a;
              }
              J[4158] = k;
              if (J[(i + 28) >> 2] == (c | 0)) {
                break a;
              }
            }
            J[d >> 2] = 4;
            g = l;
            h = m;
            e = n;
            f = o;
          }
          J[a >> 2] = g;
          J[(a + 4) >> 2] = h;
          J[(a + 8) >> 2] = e;
          J[(a + 12) >> 2] = f;
          ka = (i + 32) | 0;
        }
        function Ba(a, b) {
          var c = 0,
            d = 0,
            e = 0,
            f = 0,
            g = 0,
            h = 0;
          a: {
            f = H[(a + 11) | 0];
            f = (f | 0) < 0 ? J[(a + 4) >> 2] : f;
            if (f >>> 0 < b >>> 0) {
              f = (b - f) | 0;
              if (f) {
                c = J[(a + 8) >> 2];
                b = H[(a + 11) | 0];
                d = (b | 0) < 0;
                e = d ? ((c & 2147483647) - 1) | 0 : 10;
                b = d ? J[(a + 4) >> 2] : b;
                b: {
                  if (f >>> 0 <= (e - b) >>> 0) {
                    e = (c >>> 24) | 0;
                    break b;
                  }
                  c: {
                    d = (((b + f) | 0) - e) | 0;
                    if (d >>> 0 <= (2147483638 - e) >>> 0) {
                      c = 2147483639;
                      if (e >>> 0 <= 1073741810) {
                        c = (e + d) | 0;
                        d = e << 1;
                        c = c >>> 0 > d >>> 0 ? c : d;
                        c = c >>> 0 < 11 ? 11 : ((c | 7) + 1) | 0;
                      }
                      d = H[(a + 11) | 0] < 0 ? J[a >> 2] : a;
                      g = za(c);
                      if (b) {
                        z(g, d, b);
                      }
                      d: {
                        if (1) {
                          break d;
                        }
                        if (1) {
                          break d;
                        }
                        z((b + g) | 0, (b + d) | 0, h);
                      }
                      if ((e | 0) != 10) {
                        Aa(d);
                      }
                      J[a >> 2] = g;
                      J[(a + 8) >> 2] = c | -2147483648;
                      break c;
                    }
                    Oa();
                    y();
                  }
                  J[(a + 4) >> 2] = b;
                  e = K[(a + 11) | 0];
                }
                d = (e << 24) >> 24 < 0 ? J[a >> 2] : a;
                c = (d + b) | 0;
                e = f;
                while (1) {
                  if (e) {
                    H[c | 0] = 0;
                    e = (e - 1) | 0;
                    c = (c + 1) | 0;
                    continue;
                  }
                  break;
                }
                b = (b + f) | 0;
                e: {
                  if (H[(a + 11) | 0] < 0) {
                    J[(a + 4) >> 2] = b;
                    break e;
                  }
                  H[(a + 11) | 0] = b & 127;
                }
                H[(b + d) | 0] = 0;
              }
              break a;
            }
            f: {
              if (H[(a + 11) | 0] < 0) {
                J[(a + 4) >> 2] = b;
                a = J[a >> 2];
                break f;
              }
              H[(a + 11) | 0] = b & 127;
            }
            H[(a + b) | 0] = 0;
          }
        }
        function Hc(a, b, c, d) {
          var e = 0,
            f = 0,
            g = 0,
            h = 0,
            i = 0,
            j = 0,
            k = 0,
            l = 0,
            m = 0,
            n = 0,
            o = 0,
            p = 0,
            q = 0,
            r = 0,
            s = 0,
            t = 0,
            u = 0,
            v = 0;
          e = (b >>> 8) | 0;
          q = e;
          e = (b >>> 16) & e;
          r = e;
          g = (b >>> 24) & e;
          e = (b >>> 6) | 0;
          s = e;
          e = (b >>> 12) & e;
          t = e;
          f = (b >>> 18) & e;
          e = (b >>> 7) | 0;
          h = e;
          e = (b >>> 14) & e;
          u = e;
          v =
            ((b >>> 21) & e) |
            (((b << 1) | (a >>> 31)) &
              ((b << 2) | (a >>> 30)) &
              ((b << 3) | (a >>> 29))) |
            f |
            g;
          e = h | ((b << 21) | (a >>> 11));
          i = (a >>> 8) | 0;
          j = i | ((b & 255) << 24);
          k = (a >>> 16) | 0;
          l = j & (k | ((b & 65535) << 16));
          m = (a >>> 24) | 0;
          n = ((b & 63) << 26) | (a >>> 6);
          o = n & (((b & 4095) << 20) | (a >>> 12));
          p = (a >>> 18) | 0;
          h = ((b & 127) << 25) | (a >>> 7);
          g = (a >>> 14) | 0;
          f = h & (g | ((b & 16383) << 18));
          f =
            (l & (m | ((b & 16777215) << 8))) |
            ((o & (p | ((b & 262143) << 14))) |
              ((f & (((b & 2097151) << 11) | (a >>> 21))) |
                ((a << 1) & (a << 2) & (a << 3)))) |
            ((f | ((h | (a << 21)) & (a << 14))) & (a << 7));
          na =
            (((r | ((q | (i | (b << 24))) & (k | (b << 16)))) &
              (m | (b << 8))) |
              (((t | ((s | (g | (b << 18))) & ((b << 12) | (a >>> 20)))) &
                ((b << 6) | (a >>> 26))) |
                (((u | ((p | (b << 14)) & e)) & ((b << 7) | (a >>> 25))) |
                  v))) &
            (d ^ 65019);
          return (
            (((l | ((j | (a << 24)) & (a << 16))) & (a << 8)) |
              (((o | ((n | (a << 18)) & (a << 12))) & (a << 6)) | f)) &
            (c ^ -135274561)
          );
        }
        function Ca(a) {
          var b = 0,
            c = 0,
            d = 0,
            e = 0,
            f = 0,
            g = 0,
            h = 0,
            i = 0,
            j = 0;
          b = J[(a + 112) >> 2];
          d = J[(a + 116) >> 2];
          i = !!(b | d);
          h = b;
          e = J[(a + 4) >> 2];
          f = J[(a + 44) >> 2];
          b = (e - f) | 0;
          g = b;
          c = (b + J[(a + 120) >> 2]) | 0;
          b = (J[(a + 124) >> 2] + (b >> 31)) | 0;
          a: {
            b = c >>> 0 < g >>> 0 ? (b + 1) | 0 : b;
            if (
              !(
                ((((b | 0) >= (d | 0)) & (c >>> 0 >= h >>> 0)) |
                  ((b | 0) > (d | 0))) &
                i
              )
            ) {
              i = yc(a);
              if ((i | 0) >= 0) {
                break a;
              }
              e = J[(a + 4) >> 2];
              f = J[(a + 44) >> 2];
            }
            J[(a + 112) >> 2] = -1;
            J[(a + 116) >> 2] = -1;
            J[(a + 104) >> 2] = e;
            g = c;
            c = (f - e) | 0;
            d = (g + c) | 0;
            b = ((c >> 31) + b) | 0;
            J[(a + 120) >> 2] = d;
            J[(a + 124) >> 2] = c >>> 0 > d >>> 0 ? (b + 1) | 0 : b;
            return -1;
          }
          d = (c + 1) | 0;
          b = d ? b : (b + 1) | 0;
          h = J[(a + 4) >> 2];
          f = J[(a + 8) >> 2];
          c = J[(a + 116) >> 2];
          g = c;
          e = J[(a + 112) >> 2];
          b: {
            if (!(c | e)) {
              break b;
            }
            c = (e - d) | 0;
            e = (g - ((b + (d >>> 0 > e >>> 0)) | 0)) | 0;
            j = (f - h) | 0;
            g = j >> 31;
            if (
              (((e | 0) >= (g | 0)) & (c >>> 0 >= j >>> 0)) |
              ((e | 0) > (g | 0))
            ) {
              break b;
            }
            f = (c + h) | 0;
          }
          J[(a + 104) >> 2] = f;
          c = J[(a + 44) >> 2];
          f = (c - h) | 0;
          d = (f + d) | 0;
          b = ((f >> 31) + b) | 0;
          J[(a + 120) >> 2] = d;
          J[(a + 124) >> 2] = d >>> 0 < f >>> 0 ? (b + 1) | 0 : b;
          if (c >>> 0 >= h >>> 0) {
            H[(h - 1) | 0] = i;
          }
          return i;
        }
        function Mb(a, b, c, d, e, f, g, h, i, j) {
          var k = 0,
            l = 0,
            m = 0;
          k = (ka - 16) | 0;
          ka = k;
          H[(k + 15) | 0] = a;
          a: {
            b: {
              c: {
                l = J[d >> 2];
                if ((l | 0) != (c | 0)) {
                  break c;
                }
                m = a & 255;
                if ((m | 0) == K[(j + 24) | 0]) {
                  a = 43;
                } else {
                  if (K[(j + 25) | 0] != (m | 0)) {
                    break c;
                  }
                  a = 45;
                }
                J[d >> 2] = l + 1;
                H[l | 0] = a;
                break b;
              }
              d: {
                if ((a | 0) != (f | 0)) {
                  break d;
                }
                a = H[(g + 11) | 0];
                if (!((a | 0) < 0 ? J[(g + 4) >> 2] : a)) {
                  break d;
                }
                a = 0;
                b = J[i >> 2];
                if (((b - h) | 0) > 159) {
                  break a;
                }
                a = J[e >> 2];
                J[i >> 2] = b + 4;
                J[b >> 2] = a;
                break b;
              }
              a = -1;
              f = (Ke(j, (j + 26) | 0, (k + 15) | 0) - j) | 0;
              if ((f | 0) > 23) {
                break a;
              }
              e: {
                f: {
                  switch ((b - 8) | 0) {
                    case 0:
                    case 2:
                      if ((b | 0) > (f | 0)) {
                        break e;
                      }
                      break a;
                    case 1:
                      break e;
                    default:
                      break f;
                  }
                }
                if (((b | 0) != 16) | ((f | 0) < 22)) {
                  break e;
                }
                b = J[d >> 2];
                if (
                  ((b | 0) == (c | 0)) |
                  (((b - c) | 0) > 2) |
                  (K[(b - 1) | 0] != 48)
                ) {
                  break a;
                }
                a = 0;
                J[e >> 2] = 0;
                J[d >> 2] = b + 1;
                H[b | 0] = K[(f + 7520) | 0];
                break a;
              }
              a = J[d >> 2];
              J[d >> 2] = a + 1;
              H[a | 0] = K[(f + 7520) | 0];
              J[e >> 2] = J[e >> 2] + 1;
              a = 0;
              break a;
            }
            a = 0;
            J[e >> 2] = 0;
          }
          ka = (k + 16) | 0;
          return a;
        }
        function uf(a, b) {
          var c = 0,
            d = 0,
            e = 0,
            f = 0,
            g = 0;
          e = (ka - 16) | 0;
          ka = e;
          g = J[4844];
          if (J[(b + 72) >> 2] <= 0) {
            ld(b);
          }
          J[4844] = J[(b + 136) >> 2];
          a: {
            b: {
              c: {
                if (a >>> 0 <= 127) {
                  d: {
                    if (J[(b + 80) >> 2] == (a | 0)) {
                      break d;
                    }
                    c = J[(b + 20) >> 2];
                    if ((c | 0) == J[(b + 16) >> 2]) {
                      break d;
                    }
                    J[(b + 20) >> 2] = c + 1;
                    H[c | 0] = a;
                    break a;
                  }
                  d = (ka - 16) | 0;
                  ka = d;
                  H[(d + 15) | 0] = a;
                  c = J[(b + 16) >> 2];
                  e: {
                    if (!c) {
                      if (Qf(b)) {
                        c = -1;
                        break e;
                      }
                      c = J[(b + 16) >> 2];
                    }
                    f: {
                      f = J[(b + 20) >> 2];
                      if ((c | 0) == (f | 0)) {
                        break f;
                      }
                      c = a & 255;
                      if ((c | 0) == J[(b + 80) >> 2]) {
                        break f;
                      }
                      J[(b + 20) >> 2] = f + 1;
                      H[f | 0] = a;
                      break e;
                    }
                    if ((oa[J[(b + 36) >> 2]](b, (d + 15) | 0, 1) | 0) != 1) {
                      c = -1;
                      break e;
                    }
                    c = K[(d + 15) | 0];
                  }
                  ka = (d + 16) | 0;
                  a = c;
                  break c;
                }
                c = J[(b + 20) >> 2];
                if (M[(b + 16) >> 2] > (c + 4) >>> 0) {
                  c = vf(c, a);
                  if ((c | 0) < 0) {
                    break b;
                  }
                  J[(b + 20) >> 2] = c + J[(b + 20) >> 2];
                  break c;
                }
                d = (e + 12) | 0;
                c = vf(d, a);
                if ((c | 0) < 0) {
                  break b;
                }
                if (td(d, c, b) >>> 0 < c >>> 0) {
                  break b;
                }
              }
              if ((a | 0) != -1) {
                break a;
              }
            }
            J[b >> 2] = J[b >> 2] | 32;
            a = -1;
          }
          J[4844] = g;
          ka = (e + 16) | 0;
          return a;
        }
        function Lb(a, b, c, d, e, f, g, h, i, j) {
          var k = 0,
            l = 0;
          k = (ka - 16) | 0;
          ka = k;
          J[(k + 12) >> 2] = a;
          a: {
            b: {
              c: {
                l = J[d >> 2];
                if ((l | 0) != (c | 0)) {
                  break c;
                }
                if (J[(j + 96) >> 2] == (a | 0)) {
                  a = 43;
                } else {
                  if (J[(j + 100) >> 2] != (a | 0)) {
                    break c;
                  }
                  a = 45;
                }
                J[d >> 2] = l + 1;
                H[l | 0] = a;
                break b;
              }
              d: {
                if ((a | 0) != (f | 0)) {
                  break d;
                }
                a = H[(g + 11) | 0];
                if (!((a | 0) < 0 ? J[(g + 4) >> 2] : a)) {
                  break d;
                }
                a = 0;
                b = J[i >> 2];
                if (((b - h) | 0) > 159) {
                  break a;
                }
                a = J[e >> 2];
                J[i >> 2] = b + 4;
                J[b >> 2] = a;
                break b;
              }
              a = -1;
              f = (Ie(j, (j + 104) | 0, (k + 12) | 0) - j) >> 2;
              if ((f | 0) > 23) {
                break a;
              }
              e: {
                f: {
                  switch ((b - 8) | 0) {
                    case 0:
                    case 2:
                      if ((b | 0) > (f | 0)) {
                        break e;
                      }
                      break a;
                    case 1:
                      break e;
                    default:
                      break f;
                  }
                }
                if (((b | 0) != 16) | ((f | 0) < 22)) {
                  break e;
                }
                b = J[d >> 2];
                if (
                  ((b | 0) == (c | 0)) |
                  (((b - c) | 0) > 2) |
                  (K[(b - 1) | 0] != 48)
                ) {
                  break a;
                }
                a = 0;
                J[e >> 2] = 0;
                J[d >> 2] = b + 1;
                H[b | 0] = K[(f + 7520) | 0];
                break a;
              }
              a = J[d >> 2];
              J[d >> 2] = a + 1;
              H[a | 0] = K[(f + 7520) | 0];
              J[e >> 2] = J[e >> 2] + 1;
              a = 0;
              break a;
            }
            a = 0;
            J[e >> 2] = 0;
          }
          ka = (k + 16) | 0;
          return a;
        }
        function Ai(a, b, c, d, e) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          var f = 0,
            g = 0,
            h = 0,
            i = 0,
            j = 0,
            k = 0;
          f = (ka - 144) | 0;
          ka = f;
          a = (f + 131) | 0;
          g = J[(c + 4) >> 2];
          h = g & 74;
          i = (h | 0) == 8;
          a: {
            if (!(i | ((e | 0) >= 0))) {
              j = e;
              if ((h | 0) == 64) {
                break a;
              }
              H[(f + 131) | 0] = 45;
              a = (f + 132) | 0;
              j = (0 - e) | 0;
              break a;
            }
            j = e;
          }
          k = (h | 0) == 64;
          if (!(i | k | (!(g & 2048) | ((e | 0) < 0)))) {
            H[a | 0] = 43;
            a = (a + 1) | 0;
          }
          i = k ? 8 : i ? 16 : 10;
          b: {
            if (!e | !(g & 512)) {
              break b;
            }
            if ((h | 0) == 64) {
              H[a | 0] = 48;
              a = (a + 1) | 0;
              break b;
            }
            if ((h | 0) != 8) {
              break b;
            }
            H[a | 0] = 48;
            H[(a + 1) | 0] = g & 16384 ? 88 : 120;
            a = (a + 2) | 0;
          }
          pc((f + 120) | 0, a, (f + 144) | 0, j, i);
          c: {
            if ((g & 16392) == 16392) {
              while (1) {
                e = J[(f + 120) >> 2];
                if ((e | 0) == (a | 0)) {
                  break c;
                }
                e = K[a | 0];
                H[a | 0] = ((e - 97) & 255) >>> 0 < 6 ? (e - 32) | 0 : e;
                a = (a + 1) | 0;
                continue;
              }
            }
            e = J[(f + 120) >> 2];
          }
          a = (f + 131) | 0;
          j = oc(a, e, c);
          g = (f + 4) | 0;
          Ha(g, c);
          h = a;
          a = (f + 16) | 0;
          Ee(h, j, e, a, (f + 12) | 0, (f + 8) | 0, g);
          Ka(J[(f + 4) >> 2]);
          a = Vc(b, a, J[(f + 12) >> 2], J[(f + 8) >> 2], c, d);
          ka = (f + 144) | 0;
          return a | 0;
        }
        function Xa() {
          var a = 0,
            b = 0,
            c = 0,
            d = 0,
            e = 0,
            f = 0,
            g = 0,
            h = 0,
            i = 0;
          if (K[20980]) {
            return J[5244];
          }
          c = (ka - 32) | 0;
          ka = c;
          a: {
            b: {
              while (1) {
                e = (c + 8) | 0;
                d = a << 2;
                g = (e + d) | 0;
                f = (1 << a) & 2147483647;
                if (f | 1) {
                  d = nf(a, f ? 1956 : 2141);
                } else {
                  d = J[d >> 2];
                }
                J[g >> 2] = d;
                if ((d | 0) == -1) {
                  break b;
                }
                a = (a + 1) | 0;
                if ((a | 0) != 6) {
                  continue;
                }
                break;
              }
              if (!mf(0)) {
                b = 5512;
                if (!uc(e, 5512)) {
                  break a;
                }
                b = 5536;
                if (!uc(e, 5536)) {
                  break a;
                }
                a = 0;
                if (!K[20656]) {
                  while (1) {
                    ((h = a << 2),
                      (i = nf(a, 2141)),
                      (J[(h + 20608) >> 2] = i));
                    a = (a + 1) | 0;
                    if ((a | 0) != 6) {
                      continue;
                    }
                    break;
                  }
                  H[20656] = 1;
                  J[5158] = J[5152];
                }
                b = 20608;
                a = (c + 8) | 0;
                if (!uc(a, 20608)) {
                  break a;
                }
                b = 20632;
                if (!uc(a, 20632)) {
                  break a;
                }
                b = Wa(24);
                if (!b) {
                  break b;
                }
              }
              a = J[(c + 28) >> 2];
              J[(b + 16) >> 2] = J[(c + 24) >> 2];
              J[(b + 20) >> 2] = a;
              a = J[(c + 20) >> 2];
              J[(b + 8) >> 2] = J[(c + 16) >> 2];
              J[(b + 12) >> 2] = a;
              a = J[(c + 12) >> 2];
              J[b >> 2] = J[(c + 8) >> 2];
              J[(b + 4) >> 2] = a;
              break a;
            }
            b = 0;
          }
          ka = (c + 32) | 0;
          H[20980] = 1;
          J[5244] = b;
          return b;
        }
        function Fi(a, b, c, d, e) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          var f = 0,
            g = 0,
            h = 0,
            i = 0,
            j = 0,
            k = 0;
          f = (ka + -64) | 0;
          ka = f;
          a = (f + 51) | 0;
          g = J[(c + 4) >> 2];
          h = g & 74;
          i = (h | 0) == 8;
          a: {
            if (!(i | ((e | 0) >= 0))) {
              j = e;
              if ((h | 0) == 64) {
                break a;
              }
              H[(f + 51) | 0] = 45;
              a = (f + 52) | 0;
              j = (0 - e) | 0;
              break a;
            }
            j = e;
          }
          k = (h | 0) == 64;
          if (!(i | k | (!(g & 2048) | ((e | 0) < 0)))) {
            H[a | 0] = 43;
            a = (a + 1) | 0;
          }
          i = k ? 8 : i ? 16 : 10;
          b: {
            if (!e | !(g & 512)) {
              break b;
            }
            if ((h | 0) == 64) {
              H[a | 0] = 48;
              a = (a + 1) | 0;
              break b;
            }
            if ((h | 0) != 8) {
              break b;
            }
            H[a | 0] = 48;
            H[(a + 1) | 0] = g & 16384 ? 88 : 120;
            a = (a + 2) | 0;
          }
          pc((f + 40) | 0, a, (f - -64) | 0, j, i);
          c: {
            if ((g & 16392) == 16392) {
              while (1) {
                e = J[(f + 40) >> 2];
                if ((e | 0) == (a | 0)) {
                  break c;
                }
                e = K[a | 0];
                H[a | 0] = ((e - 97) & 255) >>> 0 < 6 ? (e - 32) | 0 : e;
                a = (a + 1) | 0;
                continue;
              }
            }
            e = J[(f + 40) >> 2];
          }
          a = (f + 51) | 0;
          j = oc(a, e, c);
          g = (f + 4) | 0;
          Ha(g, c);
          h = a;
          a = (f + 16) | 0;
          Ge(h, j, e, a, (f + 12) | 0, (f + 8) | 0, g);
          Ka(J[(f + 4) >> 2]);
          a = jc(b, a, J[(f + 12) >> 2], J[(f + 8) >> 2], c, d);
          ka = (f - -64) | 0;
          return a | 0;
        }
        function df(a, b, c, d, e, f) {
          var g = 0;
          g = (ka - 80) | 0;
          ka = g;
          a: {
            if ((f | 0) >= 16384) {
              Fa((g + 32) | 0, b, c, d, e, 0, 0, 0, 2147352576);
              d = J[(g + 40) >> 2];
              e = J[(g + 44) >> 2];
              b = J[(g + 32) >> 2];
              c = J[(g + 36) >> 2];
              if (f >>> 0 < 32767) {
                f = (f - 16383) | 0;
                break a;
              }
              Fa((g + 16) | 0, b, c, d, e, 0, 0, 0, 2147352576);
              f = ((f >>> 0 >= 49149 ? 49149 : f) - 32766) | 0;
              d = J[(g + 24) >> 2];
              e = J[(g + 28) >> 2];
              b = J[(g + 16) >> 2];
              c = J[(g + 20) >> 2];
              break a;
            }
            if ((f | 0) > -16383) {
              break a;
            }
            Fa((g - -64) | 0, b, c, d, e, 0, 0, 0, 7471104);
            d = J[(g + 72) >> 2];
            e = J[(g + 76) >> 2];
            b = J[(g + 64) >> 2];
            c = J[(g + 68) >> 2];
            if (f >>> 0 > 4294934644) {
              f = (f + 16269) | 0;
              break a;
            }
            Fa((g + 48) | 0, b, c, d, e, 0, 0, 0, 7471104);
            f = ((f >>> 0 <= 4294918376 ? -48920 : f) + 32538) | 0;
            d = J[(g + 56) >> 2];
            e = J[(g + 60) >> 2];
            b = J[(g + 48) >> 2];
            c = J[(g + 52) >> 2];
          }
          Fa(g, b, c, d, e, 0, 0, 0, (f + 16383) << 16);
          b = J[(g + 12) >> 2];
          J[(a + 8) >> 2] = J[(g + 8) >> 2];
          J[(a + 12) >> 2] = b;
          b = J[(g + 4) >> 2];
          J[a >> 2] = J[g >> 2];
          J[(a + 4) >> 2] = b;
          ka = (g + 80) | 0;
        }
        function Zj(a, b, c) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          var d = 0,
            e = 0,
            f = 0,
            g = 0,
            h = 0,
            i = 0,
            j = 0;
          d = (ka - 32) | 0;
          ka = d;
          e = J[(a + 28) >> 2];
          J[(d + 16) >> 2] = e;
          f = J[(a + 20) >> 2];
          J[(d + 28) >> 2] = c;
          J[(d + 24) >> 2] = b;
          b = (f - e) | 0;
          J[(d + 20) >> 2] = b;
          f = (b + c) | 0;
          i = 2;
          a: {
            b: {
              b = (d + 16) | 0;
              c: {
                d: {
                  if (ic(aa(J[(a + 60) >> 2], b | 0, 2, (d + 12) | 0) | 0)) {
                    e = b;
                    break d;
                  }
                  while (1) {
                    g = J[(d + 12) >> 2];
                    if ((g | 0) == (f | 0)) {
                      break c;
                    }
                    if ((g | 0) < 0) {
                      e = b;
                      break b;
                    }
                    h = J[(b + 4) >> 2];
                    j = h >>> 0 < g >>> 0;
                    e = ((j ? 8 : 0) + b) | 0;
                    h = (g - (j ? h : 0)) | 0;
                    J[e >> 2] = h + J[e >> 2];
                    b = ((j ? 12 : 4) + b) | 0;
                    J[b >> 2] = J[b >> 2] - h;
                    f = (f - g) | 0;
                    b = e;
                    i = (i - j) | 0;
                    if (
                      !ic(aa(J[(a + 60) >> 2], b | 0, i | 0, (d + 12) | 0) | 0)
                    ) {
                      continue;
                    }
                    break;
                  }
                }
                if ((f | 0) != -1) {
                  break b;
                }
              }
              b = J[(a + 44) >> 2];
              J[(a + 28) >> 2] = b;
              J[(a + 20) >> 2] = b;
              J[(a + 16) >> 2] = b + J[(a + 48) >> 2];
              a = c;
              break a;
            }
            J[(a + 28) >> 2] = 0;
            J[(a + 16) >> 2] = 0;
            J[(a + 20) >> 2] = 0;
            J[a >> 2] = J[a >> 2] | 32;
            a = 0;
            if ((i | 0) == 2) {
              break a;
            }
            a = (c - J[(e + 4) >> 2]) | 0;
          }
          ka = (d + 32) | 0;
          return a | 0;
        }
        function nf(a, b) {
          var c = 0,
            d = 0,
            e = 0;
          a: {
            if (K[b | 0]) {
              break a;
            }
            b = gd(1934);
            if (K[b | 0] ? b : 0) {
              break a;
            }
            b = gd((P(a, 12) + 6192) | 0);
            if (K[b | 0] ? b : 0) {
              break a;
            }
            b = gd(1947);
            if (K[b | 0] ? b : 0) {
              break a;
            }
            b = 2005;
          }
          b: {
            while (1) {
              d = K[(b + c) | 0];
              if (!(!d | ((d | 0) == 47))) {
                d = 23;
                c = (c + 1) | 0;
                if ((c | 0) != 23) {
                  continue;
                }
                break b;
              }
              break;
            }
            d = c;
          }
          e = 2005;
          c: {
            d: {
              c = K[b | 0];
              e: {
                f: {
                  if (!(K[(b + d) | 0] | ((c | 0) == 46))) {
                    e = b;
                    if ((c | 0) != 67) {
                      break f;
                    }
                  }
                  if (!K[(e + 1) | 0]) {
                    break e;
                  }
                }
                if (!vc(e, 2005)) {
                  break e;
                }
                if (vc(e, 1903)) {
                  break d;
                }
              }
              if (!a) {
                c = 5476;
                if (K[(e + 1) | 0] == 46) {
                  break c;
                }
              }
              return 0;
            }
            c = J[5151];
            if (c) {
              while (1) {
                if (!vc(e, (c + 8) | 0)) {
                  break c;
                }
                c = J[(c + 32) >> 2];
                if (c) {
                  continue;
                }
                break;
              }
            }
            c = Wa(36);
            if (c) {
              b = J[1370];
              J[c >> 2] = J[1369];
              J[(c + 4) >> 2] = b;
              b = (c + 8) | 0;
              vb(b, e, d);
              H[(b + d) | 0] = 0;
              J[(c + 32) >> 2] = J[5151];
              J[5151] = c;
            }
            c = a | c ? c : 5476;
          }
          return c;
        }
        function Da(a, b) {
          var c = 0,
            d = 0,
            e = 0,
            f = 0,
            g = 0,
            h = 0,
            i = 0;
          a: {
            d = Xe(b);
            f = J[(a + 8) >> 2];
            c = H[(a + 11) | 0];
            g = (c | 0) < 0;
            e = g ? ((f & 2147483647) - 1) | 0 : 1;
            if (d >>> 0 <= e >>> 0) {
              c = g ? J[a >> 2] : a;
              if (d) {
                e = d << 2;
                if (e) {
                  z(c, b, e);
                }
                b = H[(a + 11) | 0];
              } else {
                b = (f >>> 24) | 0;
              }
              b: {
                if ((b << 24) >> 24 < 0) {
                  J[(a + 4) >> 2] = d;
                  break b;
                }
                H[(a + 11) | 0] = d & 127;
              }
              J[(c + (d << 2)) >> 2] = 0;
              break a;
            }
            f = a;
            a = g ? J[(a + 4) >> 2] : c;
            c: {
              c = (d - e) | 0;
              if (c >>> 0 <= (1073741814 - e) >>> 0) {
                i = 1073741815;
                if (e >>> 0 <= 536870898) {
                  g = (c + e) | 0;
                  c = e << 1;
                  i = (((c >>> 0 < g >>> 0 ? g : c) | 1) + 1) | 0;
                }
                g = H[(f + 11) | 0] < 0 ? J[f >> 2] : f;
                h = Jb(i);
                d: {
                  if (!d) {
                    break d;
                  }
                  c = d << 2;
                  if (!c) {
                    break d;
                  }
                  z(h, b, c);
                }
                c = 0;
                e: {
                  if (1) {
                    break e;
                  }
                  b = c << 2;
                  if (!b) {
                    break e;
                  }
                  z(((d << 2) + h) | 0, (g + (a << 2)) | 0, b);
                }
                if ((e | 0) != 1) {
                  Aa(g);
                }
                J[f >> 2] = h;
                J[(f + 8) >> 2] = i | -2147483648;
                a = (c + d) | 0;
                J[(f + 4) >> 2] = a;
                J[(h + (a << 2)) >> 2] = 0;
                break c;
              }
              Oa();
              y();
            }
          }
        }
        function qj(a, b) {
          a = a | 0;
          b = b | 0;
          var c = 0,
            d = 0,
            e = 0,
            f = 0;
          c = (ka - 32) | 0;
          ka = c;
          e = -1;
          a: {
            if ((b | 0) == -1) {
              if (K[(a + 52) | 0]) {
                break a;
              }
              e = J[(a + 48) >> 2];
              H[(a + 52) | 0] = (e | 0) != -1;
              break a;
            }
            b: {
              e = K[(a + 52) | 0];
              if (!(!(e & 1) | (K[(a + 53) | 0] != 1))) {
                e = -1;
                if ((yf(J[(a + 48) >> 2], J[(a + 32) >> 2]) | 0) == -1) {
                  break a;
                }
                break b;
              }
              if (!(e & 1)) {
                break b;
              }
              J[(c + 16) >> 2] = J[(a + 48) >> 2];
              e = -1;
              c: {
                d: {
                  d = J[(a + 36) >> 2];
                  f = (c + 20) | 0;
                  switch (
                    ((oa[J[(J[d >> 2] + 12) >> 2]](
                      d,
                      J[(a + 40) >> 2],
                      (c + 16) | 0,
                      f,
                      (c + 12) | 0,
                      (c + 24) | 0,
                      (c + 32) | 0,
                      f,
                    ) |
                      0) -
                      1) |
                    0
                  ) {
                    case 0:
                    case 1:
                      break a;
                    case 2:
                      break d;
                    default:
                      break c;
                  }
                }
                d = J[(a + 48) >> 2];
                J[(c + 20) >> 2] = c + 25;
                H[(c + 24) | 0] = d;
              }
              while (1) {
                d = J[(c + 20) >> 2];
                if (d >>> 0 <= (c + 24) >>> 0) {
                  break b;
                }
                d = (d - 1) | 0;
                J[(c + 20) >> 2] = d;
                if ((Hb(H[d | 0], J[(a + 32) >> 2]) | 0) != -1) {
                  continue;
                }
                break;
              }
              break a;
            }
            H[(a + 52) | 0] = 1;
            J[(a + 48) >> 2] = b;
            e = b;
          }
          ka = (c + 32) | 0;
          return e | 0;
        }
        function Jj(a, b, c) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          var d = 0,
            e = 0;
          J[(a + 24) >> 2] = 0;
          J[(a + 28) >> 2] = 0;
          J[(a + 16) >> 2] = 0;
          J[(a + 20) >> 2] = 0;
          J[(a + 8) >> 2] = 0;
          J[(a + 12) >> 2] = 0;
          if (!(b | c | (J[(a + 92) >> 2] != 32))) {
            d = J[(a + 64) >> 2];
            if (d) {
              Uf(d);
              d = 0;
            } else {
              d = 34;
            }
            J[(a + 92) >> 2] = d;
          }
          a: {
            if (K[(a + 96) | 0] != 1) {
              break a;
            }
            d = J[(a + 32) >> 2];
            if (!d) {
              break a;
            }
            Aa(d);
          }
          b: {
            if (K[(a + 97) | 0] != 1) {
              break b;
            }
            d = J[(a + 56) >> 2];
            if (!d) {
              break b;
            }
            Aa(d);
          }
          J[(a + 52) >> 2] = c;
          c: {
            d: {
              e: {
                if (c >>> 0 >= 9) {
                  d = K[(a + 98) | 0];
                  if (!(!b | !(d & 1))) {
                    H[(a + 96) | 0] = 0;
                    J[(a + 32) >> 2] = b;
                    break e;
                  }
                  e = za(c);
                  H[(a + 96) | 0] = 1;
                  J[(a + 32) >> 2] = e;
                  if (d & 1) {
                    break e;
                  }
                  break d;
                }
                H[(a + 96) | 0] = 0;
                J[(a + 52) >> 2] = 8;
                J[(a + 32) >> 2] = a + 44;
                if (!K[(a + 98) | 0]) {
                  break d;
                }
              }
              b = 0;
              J[(a + 60) >> 2] = 0;
              c = 0;
              break c;
            }
            d = (c | 0) > 8;
            e = d ? c : 8;
            J[(a + 60) >> 2] = e;
            if (b) {
              c = 0;
              if (d) {
                break c;
              }
            }
            b = za(e);
            c = 1;
          }
          H[(a + 97) | 0] = c;
          J[(a + 56) >> 2] = b;
          return a | 0;
        }
        function xj(a, b) {
          a = a | 0;
          b = b | 0;
          var c = 0,
            d = 0,
            e = 0,
            f = 0;
          c = (ka - 32) | 0;
          ka = c;
          e = -1;
          a: {
            if ((b | 0) == -1) {
              if (K[(a + 52) | 0]) {
                break a;
              }
              e = J[(a + 48) >> 2];
              H[(a + 52) | 0] = (e | 0) != -1;
              break a;
            }
            b: {
              e = K[(a + 52) | 0];
              if (!(!(e & 1) | (K[(a + 53) | 0] != 1))) {
                e = -1;
                if ((Hb(J[(a + 48) >> 2], J[(a + 32) >> 2]) | 0) == -1) {
                  break a;
                }
                break b;
              }
              if (!(e & 1)) {
                break b;
              }
              H[(c + 19) | 0] = J[(a + 48) >> 2];
              e = -1;
              c: {
                d: {
                  d = J[(a + 36) >> 2];
                  f = (c + 20) | 0;
                  switch (
                    ((oa[J[(J[d >> 2] + 12) >> 2]](
                      d,
                      J[(a + 40) >> 2],
                      (c + 19) | 0,
                      f,
                      (c + 12) | 0,
                      (c + 24) | 0,
                      (c + 32) | 0,
                      f,
                    ) |
                      0) -
                      1) |
                    0
                  ) {
                    case 0:
                    case 1:
                      break a;
                    case 2:
                      break d;
                    default:
                      break c;
                  }
                }
                d = J[(a + 48) >> 2];
                J[(c + 20) >> 2] = c + 25;
                H[(c + 24) | 0] = d;
              }
              while (1) {
                d = J[(c + 20) >> 2];
                if (d >>> 0 <= (c + 24) >>> 0) {
                  break b;
                }
                d = (d - 1) | 0;
                J[(c + 20) >> 2] = d;
                if ((Hb(H[d | 0], J[(a + 32) >> 2]) | 0) != -1) {
                  continue;
                }
                break;
              }
              break a;
            }
            H[(a + 52) | 0] = 1;
            J[(a + 48) >> 2] = b;
            e = b;
          }
          ka = (c + 32) | 0;
          return e | 0;
        }
        function wf(a) {
          var b = 0,
            c = 0,
            d = 0,
            e = 0,
            f = 0;
          f = J[4844];
          if (J[(a + 72) >> 2] <= 0) {
            ld(a);
          }
          J[4844] = J[(a + 136) >> 2];
          c = (ka - 32) | 0;
          ka = c;
          a: {
            b: {
              c: {
                b = J[(a + 4) >> 2];
                d = J[(a + 8) >> 2];
                if ((b | 0) == (d | 0)) {
                  break c;
                }
                b = xf((c + 28) | 0, b, (d - b) | 0);
                if ((b | 0) == -1) {
                  break c;
                }
                J[(a + 4) >> 2] = J[(a + 4) >> 2] + (b >>> 0 <= 1 ? 1 : b);
                break b;
              }
              J[(c + 16) >> 2] = 0;
              J[(c + 20) >> 2] = 0;
              b = 0;
              while (1) {
                d = b;
                d: {
                  b = J[(a + 4) >> 2];
                  if ((b | 0) != J[(a + 8) >> 2]) {
                    J[(a + 4) >> 2] = b + 1;
                    H[(c + 15) | 0] = K[b | 0];
                    break d;
                  }
                  b = yc(a);
                  H[(c + 15) | 0] = b;
                  if ((b | 0) >= 0) {
                    break d;
                  }
                  b = -1;
                  if (!(d & 1)) {
                    break a;
                  }
                  J[a >> 2] = J[a >> 2] | 32;
                  J[4158] = 25;
                  break a;
                }
                b = 1;
                e = bc((c + 28) | 0, (c + 15) | 0, 1, (c + 16) | 0);
                if ((e | 0) == -2) {
                  continue;
                }
                break;
              }
              b = -1;
              if ((e | 0) != -1) {
                break b;
              }
              if (!(d & 1)) {
                break a;
              }
              J[a >> 2] = J[a >> 2] | 32;
              Hb(K[(c + 15) | 0], a);
              break a;
            }
            b = J[(c + 28) >> 2];
          }
          ka = (c + 32) | 0;
          J[4844] = f;
          return b;
        }
        function Gj(a, b) {
          a = a | 0;
          b = b | 0;
          var c = 0;
          oa[J[(J[a >> 2] + 24) >> 2]](a) | 0;
          b = ec(b);
          J[(a + 68) >> 2] = b;
          c = K[(a + 98) | 0];
          b = oa[J[(J[b >> 2] + 28) >> 2]](b) | 0;
          H[(a + 98) | 0] = b;
          if ((b | 0) != (c | 0)) {
            J[(a + 24) >> 2] = 0;
            J[(a + 28) >> 2] = 0;
            J[(a + 16) >> 2] = 0;
            J[(a + 20) >> 2] = 0;
            J[(a + 8) >> 2] = 0;
            J[(a + 12) >> 2] = 0;
            c = K[(a + 96) | 0];
            if (b) {
              a: {
                if (!(c & 1)) {
                  break a;
                }
                b = J[(a + 32) >> 2];
                if (!b) {
                  break a;
                }
                Aa(b);
              }
              H[(a + 96) | 0] = K[(a + 97) | 0];
              J[(a + 52) >> 2] = J[(a + 60) >> 2];
              b = J[(a + 56) >> 2];
              J[(a + 56) >> 2] = 0;
              J[(a + 60) >> 2] = 0;
              J[(a + 32) >> 2] = b;
              H[(a + 97) | 0] = 0;
              return;
            }
            b: {
              if (c & 1) {
                break b;
              }
              b = J[(a + 32) >> 2];
              if ((b | 0) == ((a + 44) | 0)) {
                break b;
              }
              H[(a + 97) | 0] = 0;
              J[(a + 56) >> 2] = b;
              b = J[(a + 52) >> 2];
              J[(a + 60) >> 2] = b;
              b = za(b);
              H[(a + 96) | 0] = 1;
              J[(a + 32) >> 2] = b;
              return;
            }
            b = J[(a + 52) >> 2];
            J[(a + 60) >> 2] = b;
            b = za(b);
            H[(a + 97) | 0] = 1;
            J[(a + 56) >> 2] = b;
          }
        }
        function uj(a, b) {
          a = a | 0;
          b = b | 0;
          var c = 0,
            d = 0,
            e = 0,
            f = 0,
            g = 0,
            h = 0;
          c = (ka - 32) | 0;
          ka = c;
          a: {
            if ((b | 0) == -1) {
              b = 0;
              break a;
            }
            H[(c + 23) | 0] = b;
            if (K[(a + 44) | 0] == 1) {
              d = J[(a + 32) >> 2];
              a = (ka - 16) | 0;
              ka = a;
              H[(a + 15) | 0] = (b << 24) >> 24;
              d = ab((a + 15) | 0, 1, 1, d);
              ka = (a + 16) | 0;
              b = (d | 0) != 1 ? -1 : b;
              break a;
            }
            f = (c + 24) | 0;
            J[(c + 16) >> 2] = f;
            h = (c + 32) | 0;
            d = (c + 23) | 0;
            while (1) {
              b: {
                e = J[(a + 36) >> 2];
                e =
                  oa[J[(J[e >> 2] + 12) >> 2]](
                    e,
                    J[(a + 40) >> 2],
                    d,
                    f,
                    (c + 12) | 0,
                    (c + 24) | 0,
                    h,
                    (c + 16) | 0,
                  ) | 0;
                if (J[(c + 12) >> 2] == (d | 0)) {
                  break b;
                }
                if ((e | 0) == 3) {
                  if ((ab(d, 1, 1, J[(a + 32) >> 2]) | 0) == 1) {
                    break a;
                  }
                  break b;
                }
                if (e >>> 0 > 1) {
                  break b;
                }
                g = (c + 24) | 0;
                d = (J[(c + 16) >> 2] - g) | 0;
                if ((ab(g, 1, d, J[(a + 32) >> 2]) | 0) != (d | 0)) {
                  break b;
                }
                d = J[(c + 12) >> 2];
                if ((e | 0) == 1) {
                  continue;
                }
                break a;
              }
              break;
            }
            b = -1;
          }
          ka = (c + 32) | 0;
          return b | 0;
        }
        function xf(a, b, c) {
          var d = 0,
            e = 0;
          if (!b) {
            return 0;
          }
          a: {
            b: {
              if (!c) {
                break b;
              }
              d = K[b | 0];
              e = (d << 24) >> 24;
              if ((e | 0) >= 0) {
                if (a) {
                  J[a >> 2] = d;
                }
                return (e | 0) != 0;
              }
              if (!J[J[4844] >> 2]) {
                b = 1;
                if (!a) {
                  break a;
                }
                J[a >> 2] = e & 57343;
                return 1;
              }
              d = (d - 194) | 0;
              if (d >>> 0 > 50) {
                break b;
              }
              d = J[((d << 2) + 5568) >> 2];
              if ((d << (P(c, 6) - 6) < 0) & (c >>> 0 <= 3)) {
                break b;
              }
              c = K[(b + 1) | 0];
              e = (c >>> 3) | 0;
              if (((e - 16) | (e + (d >> 26))) >>> 0 > 7) {
                break b;
              }
              c = (c - 128) | (d << 6);
              if ((c | 0) >= 0) {
                b = 2;
                if (!a) {
                  break a;
                }
                J[a >> 2] = c;
                return 2;
              }
              d = (K[(b + 2) | 0] - 128) | 0;
              if (d >>> 0 > 63) {
                break b;
              }
              e = d;
              d = c << 6;
              c = e | d;
              if ((d | 0) >= 0) {
                b = 3;
                if (!a) {
                  break a;
                }
                J[a >> 2] = c;
                return 3;
              }
              d = (K[(b + 3) | 0] - 128) | 0;
              if (d >>> 0 > 63) {
                break b;
              }
              b = 4;
              if (!a) {
                break a;
              }
              J[a >> 2] = d | (c << 6);
              return 4;
            }
            J[4158] = 25;
            b = -1;
          }
          return b;
        }
        function bc(a, b, c, d) {
          var e = 0,
            f = 0,
            g = 0,
            h = 0;
          g = d ? d : 19412;
          d = J[g >> 2];
          a: {
            b: {
              c: {
                if (!b) {
                  if (d) {
                    break c;
                  }
                  return 0;
                }
                e = -2;
                if (!c) {
                  break b;
                }
                d: {
                  if (d) {
                    e = c;
                    break d;
                  }
                  d = K[b | 0];
                  f = (d << 24) >> 24;
                  if ((f | 0) >= 0) {
                    if (a) {
                      J[a >> 2] = d;
                    }
                    return (f | 0) != 0;
                  }
                  if (!J[J[4844] >> 2]) {
                    e = 1;
                    if (!a) {
                      break b;
                    }
                    J[a >> 2] = f & 57343;
                    return 1;
                  }
                  d = (d - 194) | 0;
                  if (d >>> 0 > 50) {
                    break c;
                  }
                  d = J[((d << 2) + 5568) >> 2];
                  e = (c - 1) | 0;
                  if (!e) {
                    break a;
                  }
                  b = (b + 1) | 0;
                }
                f = K[b | 0];
                h = (f >>> 3) | 0;
                if (((h - 16) | ((d >> 26) + h)) >>> 0 > 7) {
                  break c;
                }
                while (1) {
                  e = (e - 1) | 0;
                  d = ((f & 255) - 128) | (d << 6);
                  if ((d | 0) >= 0) {
                    J[g >> 2] = 0;
                    if (a) {
                      J[a >> 2] = d;
                    }
                    return (c - e) | 0;
                  }
                  if (!e) {
                    break a;
                  }
                  b = (b + 1) | 0;
                  f = H[b | 0];
                  if ((f | 0) < -64) {
                    continue;
                  }
                  break;
                }
              }
              J[g >> 2] = 0;
              J[4158] = 25;
              e = -1;
            }
            return e;
          }
          J[g >> 2] = d;
          return -2;
        }
        function Fb(a, b, c, d, e, f, g, h) {
          var i = 0,
            j = 0,
            k = 0,
            l = 0;
          k = 1;
          i = d & 2147483647;
          j = i;
          l = (i | 0) == 2147418112;
          a: {
            if (
              l & !c ? a | b : (l & ((c | 0) != 0)) | (i >>> 0 > 2147418112)
            ) {
              break a;
            }
            i = h & 2147483647;
            if (
              !g & ((i | 0) == 2147418112)
                ? e | f
                : (((i | 0) == 2147418112) & ((g | 0) != 0)) |
                  (i >>> 0 > 2147418112)
            ) {
              break a;
            }
            if (!(a | e | (c | g) | (b | f | (i | j)))) {
              return 0;
            }
            i = d & h;
            if ((i | 0) > 0) {
              j = 1;
            } else {
              j = (i | 0) >= 0;
            }
            if (j) {
              if (
                ((c | 0) == (g | 0)) & ((d | 0) == (h | 0))
                  ? (((b | 0) == (f | 0)) & (a >>> 0 < e >>> 0)) |
                    (b >>> 0 < f >>> 0)
                  : ((c >>> 0 < g >>> 0) & ((d | 0) <= (h | 0))) |
                    ((d | 0) < (h | 0))
              ) {
                return -1;
              }
              return ((a ^ e) | (c ^ g) | ((b ^ f) | (d ^ h))) != 0;
            }
            if (
              ((c | 0) == (g | 0)) & ((d | 0) == (h | 0))
                ? (((b | 0) == (f | 0)) & (a >>> 0 > e >>> 0)) |
                  (b >>> 0 > f >>> 0)
                : ((c >>> 0 > g >>> 0) & ((d | 0) >= (h | 0))) |
                  ((d | 0) > (h | 0))
            ) {
              return -1;
            }
            k = ((a ^ e) | (c ^ g) | ((b ^ f) | (d ^ h))) != 0;
          }
          return k;
        }
        function nj(a, b) {
          a = a | 0;
          b = b | 0;
          var c = 0,
            d = 0,
            e = 0,
            f = 0,
            g = 0,
            h = 0;
          c = (ka - 32) | 0;
          ka = c;
          a: {
            if ((b | 0) == -1) {
              b = 0;
              break a;
            }
            J[(c + 20) >> 2] = b;
            if (K[(a + 44) | 0] == 1) {
              a = J[(a + 32) >> 2];
              b: {
                if (J[(a + 76) >> 2] < 0) {
                  a = uf(b, a);
                  break b;
                }
                a = uf(b, a);
              }
              b = (a | 0) == -1 ? -1 : b;
              break a;
            }
            f = (c + 24) | 0;
            J[(c + 16) >> 2] = f;
            h = (c + 32) | 0;
            d = (c + 20) | 0;
            while (1) {
              c: {
                e = J[(a + 36) >> 2];
                e =
                  oa[J[(J[e >> 2] + 12) >> 2]](
                    e,
                    J[(a + 40) >> 2],
                    d,
                    f,
                    (c + 12) | 0,
                    (c + 24) | 0,
                    h,
                    (c + 16) | 0,
                  ) | 0;
                if (J[(c + 12) >> 2] == (d | 0)) {
                  break c;
                }
                if ((e | 0) == 3) {
                  if ((ab(d, 1, 1, J[(a + 32) >> 2]) | 0) == 1) {
                    break a;
                  }
                  break c;
                }
                if (e >>> 0 > 1) {
                  break c;
                }
                g = (c + 24) | 0;
                d = (J[(c + 16) >> 2] - g) | 0;
                if ((ab(g, 1, d, J[(a + 32) >> 2]) | 0) != (d | 0)) {
                  break c;
                }
                d = J[(c + 12) >> 2];
                if ((e | 0) == 1) {
                  continue;
                }
                break a;
              }
              break;
            }
            b = -1;
          }
          ka = (c + 32) | 0;
          return b | 0;
        }
        function Bi(a, b, c, d, e) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          var f = 0;
          f = (ka - 16) | 0;
          ka = f;
          J[(f + 12) >> 2] = b;
          a: {
            if (!(H[(c + 4) | 0] & 1)) {
              c = oa[J[(J[a >> 2] + 24) >> 2]](a, b, c, d, e) | 0;
              break a;
            }
            Ha(f, c);
            a = Yb(f);
            Ka(J[f >> 2]);
            oa[J[(J[a >> 2] + (e ? 24 : 28)) >> 2]](f, a);
            e = J[f >> 2];
            b = H[(f + 11) | 0];
            c = (b | 0) < 0 ? e : f;
            while (1) {
              a = (b << 24) >> 24 < 0;
              if (
                (((a ? e : f) + ((a ? J[(f + 4) >> 2] : b & 255) << 2)) | 0) ==
                (c | 0)
              ) {
                c = J[(f + 12) >> 2];
                ya(f);
              } else {
                b = J[c >> 2];
                e = (f + 12) | 0;
                a = J[e >> 2];
                b: {
                  if (!a) {
                    break b;
                  }
                  d = J[(a + 24) >> 2];
                  c: {
                    if ((d | 0) == J[(a + 28) >> 2]) {
                      b = oa[J[(J[a >> 2] + 52) >> 2]](a, b) | 0;
                      break c;
                    }
                    J[d >> 2] = b;
                    J[(a + 24) >> 2] = d + 4;
                  }
                  if ((b | 0) != -1) {
                    break b;
                  }
                  J[e >> 2] = 0;
                }
                c = (c + 4) | 0;
                e = J[f >> 2];
                b = K[(f + 11) | 0];
                continue;
              }
              break;
            }
          }
          ka = (f + 16) | 0;
          return c | 0;
        }
        function yg(a, b, c, d, e, f) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          f = f | 0;
          var g = 0,
            h = 0,
            i = 0,
            j = 0,
            k = 0,
            l = 0;
          if (pb(a, J[(b + 8) >> 2], f)) {
            Kc(b, c, d, e);
            return;
          }
          h = K[(b + 53) | 0];
          g = J[(a + 12) >> 2];
          H[(b + 53) | 0] = 0;
          i = K[(b + 52) | 0];
          H[(b + 52) | 0] = 0;
          j = (a + 16) | 0;
          Jc(j, b, c, d, e, f);
          k = K[(b + 52) | 0];
          i = i | k;
          l = K[(b + 53) | 0];
          h = h | l;
          a: {
            if (g >>> 0 < 2) {
              break a;
            }
            j = (j + (g << 3)) | 0;
            g = (a + 24) | 0;
            while (1) {
              if (K[(b + 54) | 0]) {
                break a;
              }
              b: {
                if (k & 1) {
                  if (J[(b + 24) >> 2] == 1) {
                    break a;
                  }
                  if (K[(a + 8) | 0] & 2) {
                    break b;
                  }
                  break a;
                }
                if (!(l & 1)) {
                  break b;
                }
                if (!(H[(a + 8) | 0] & 1)) {
                  break a;
                }
              }
              I[(b + 52) >> 1] = 0;
              Jc(g, b, c, d, e, f);
              l = K[(b + 53) | 0];
              h = (l | h) & 1;
              k = K[(b + 52) | 0];
              i = (k | i) & 1;
              g = (g + 8) | 0;
              if (j >>> 0 > g >>> 0) {
                continue;
              }
              break;
            }
          }
          H[(b + 53) | 0] = h & 1;
          H[(b + 52) | 0] = i & 1;
        }
        function Ea(a, b) {
          var c = 0,
            d = 0,
            e = 0,
            f = 0,
            g = 0,
            h = 0;
          a: {
            d = Sb(b);
            g = J[(a + 8) >> 2];
            c = H[(a + 11) | 0];
            e = (c | 0) < 0;
            f = e ? ((g & 2147483647) - 1) | 0 : 10;
            if (d >>> 0 <= f >>> 0) {
              f = e ? J[a >> 2] : a;
              if (d) {
                if (d) {
                  z(f, b, d);
                }
                b = H[(a + 11) | 0];
              } else {
                b = (g >>> 24) | 0;
              }
              b: {
                if ((b << 24) >> 24 < 0) {
                  J[(a + 4) >> 2] = d;
                  break b;
                }
                H[(a + 11) | 0] = d & 127;
              }
              H[(d + f) | 0] = 0;
              break a;
            }
            g = a;
            a = e ? J[(a + 4) >> 2] : c;
            c: {
              c = (d - f) | 0;
              if (c >>> 0 <= (2147483638 - f) >>> 0) {
                e = 2147483639;
                if (f >>> 0 <= 1073741810) {
                  e = (c + f) | 0;
                  c = f << 1;
                  c = c >>> 0 < e >>> 0 ? e : c;
                  e = c >>> 0 < 11 ? 11 : ((c | 7) + 1) | 0;
                }
                c = H[(g + 11) | 0] < 0 ? J[g >> 2] : g;
                h = za(e);
                if (d) {
                  z(h, b, d);
                }
                b = 0;
                if ((f | 0) != 10) {
                  Aa(c);
                }
                J[g >> 2] = h;
                J[(g + 8) >> 2] = e | -2147483648;
                a = (b + d) | 0;
                J[(g + 4) >> 2] = a;
                H[(a + h) | 0] = 0;
                break c;
              }
              Oa();
              y();
            }
          }
        }
        function De(a, b, c, d) {
          var e = 0,
            f = 0,
            g = 0,
            h = 0,
            i = 0,
            j = 0;
          e = (ka - 144) | 0;
          ka = e;
          g = J[(b + 4) >> 2];
          h = g & 74;
          i = (h | 0) == 64;
          j = i ? 8 : (h | 0) == 8 ? 16 : 10;
          f = (e + 131) | 0;
          a: {
            if (!d | !(g & 512)) {
              break a;
            }
            if (i) {
              H[(e + 131) | 0] = 48;
              f = (e + 132) | 0;
              break a;
            }
            if ((h | 0) != 8) {
              break a;
            }
            H[(e + 131) | 0] = 48;
            H[(e + 132) | 0] = g & 16384 ? 88 : 120;
            f = (e + 133) | 0;
          }
          pc((e + 120) | 0, f, (e + 144) | 0, d, j);
          d = J[(e + 120) >> 2];
          b: {
            if ((g & 16392) != 16392) {
              break b;
            }
            while (1) {
              if ((d | 0) == (f | 0)) {
                break b;
              }
              g = K[f | 0];
              H[f | 0] = ((g - 97) & 255) >>> 0 < 6 ? (g - 32) | 0 : g;
              f = (f + 1) | 0;
              continue;
            }
          }
          f = (e + 131) | 0;
          g = oc(f, d, b);
          h = (e + 4) | 0;
          Ha(h, b);
          i = d;
          d = (e + 16) | 0;
          Ee(f, g, i, d, (e + 12) | 0, (e + 8) | 0, h);
          Ka(J[(e + 4) >> 2]);
          a = Vc(a, d, J[(e + 12) >> 2], J[(e + 8) >> 2], b, c);
          ka = (e + 144) | 0;
          return a;
        }
        function Fe(a, b, c, d) {
          var e = 0,
            f = 0,
            g = 0,
            h = 0,
            i = 0,
            j = 0;
          e = (ka + -64) | 0;
          ka = e;
          g = J[(b + 4) >> 2];
          h = g & 74;
          i = (h | 0) == 64;
          j = i ? 8 : (h | 0) == 8 ? 16 : 10;
          f = (e + 51) | 0;
          a: {
            if (!d | !(g & 512)) {
              break a;
            }
            if (i) {
              H[(e + 51) | 0] = 48;
              f = (e + 52) | 0;
              break a;
            }
            if ((h | 0) != 8) {
              break a;
            }
            H[(e + 51) | 0] = 48;
            H[(e + 52) | 0] = g & 16384 ? 88 : 120;
            f = (e + 53) | 0;
          }
          pc((e + 40) | 0, f, (e - -64) | 0, d, j);
          d = J[(e + 40) >> 2];
          b: {
            if ((g & 16392) != 16392) {
              break b;
            }
            while (1) {
              if ((d | 0) == (f | 0)) {
                break b;
              }
              g = K[f | 0];
              H[f | 0] = ((g - 97) & 255) >>> 0 < 6 ? (g - 32) | 0 : g;
              f = (f + 1) | 0;
              continue;
            }
          }
          f = (e + 51) | 0;
          g = oc(f, d, b);
          h = (e + 4) | 0;
          Ha(h, b);
          i = d;
          d = (e + 16) | 0;
          Ge(f, g, i, d, (e + 12) | 0, (e + 8) | 0, h);
          Ka(J[(e + 4) >> 2]);
          a = jc(a, d, J[(e + 12) >> 2], J[(e + 8) >> 2], b, c);
          ka = (e - -64) | 0;
          return a;
        }
        function Ag(a, b, c, d, e) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          a: {
            if (pb(a, J[(b + 8) >> 2], e)) {
              if ((J[(b + 28) >> 2] == 1) | (J[(b + 4) >> 2] != (c | 0))) {
                break a;
              }
              J[(b + 28) >> 2] = d;
              return;
            }
            if (pb(a, J[b >> 2], e)) {
              if (
                !((J[(b + 16) >> 2] != (c | 0)) & (J[(b + 20) >> 2] != (c | 0)))
              ) {
                if ((d | 0) != 1) {
                  break a;
                }
                J[(b + 32) >> 2] = 1;
                return;
              }
              J[(b + 32) >> 2] = d;
              b: {
                if (J[(b + 44) >> 2] == 4) {
                  break b;
                }
                I[(b + 52) >> 1] = 0;
                a = J[(a + 8) >> 2];
                oa[J[(J[a >> 2] + 20) >> 2]](a, b, c, c, 1, e);
                if (K[(b + 53) | 0] == 1) {
                  J[(b + 44) >> 2] = 3;
                  if (!K[(b + 52) | 0]) {
                    break b;
                  }
                  break a;
                }
                J[(b + 44) >> 2] = 4;
              }
              J[(b + 20) >> 2] = c;
              J[(b + 40) >> 2] = J[(b + 40) >> 2] + 1;
              if ((J[(b + 36) >> 2] != 1) | (J[(b + 24) >> 2] != 2)) {
                break a;
              }
              H[(b + 54) | 0] = 1;
              return;
            }
            a = J[(a + 8) >> 2];
            oa[J[(J[a >> 2] + 24) >> 2]](a, b, c, d, e);
          }
        }
        function Qi(a, b, c, d, e, f) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          f = f | 0;
          var g = 0,
            h = 0,
            i = 0;
          g = (ka - 32) | 0;
          ka = g;
          J[(g + 28) >> 2] = b;
          a: {
            if (!(H[(d + 4) | 0] & 1)) {
              J[g >> 2] = -1;
              b = oa[J[(J[a >> 2] + 16) >> 2]](a, b, c, d, e, g) | 0;
              b: {
                switch (J[g >> 2]) {
                  case 0:
                    H[f | 0] = 0;
                    break a;
                  case 1:
                    H[f | 0] = 1;
                    break a;
                  default:
                    break b;
                }
              }
              H[f | 0] = 1;
              J[e >> 2] = 4;
              break a;
            }
            Ha(g, d);
            b = ib(g);
            Ka(J[g >> 2]);
            Ha(g, d);
            a = Yb(g);
            Ka(J[g >> 2]);
            oa[J[(J[a >> 2] + 24) >> 2]](g, a);
            oa[J[(J[a >> 2] + 28) >> 2]](g | 12, a);
            d = (g + 24) | 0;
            ((h = f),
              (i = (rc((g + 28) | 0, c, g, d, b, e, 1) | 0) == (g | 0)),
              (H[h | 0] = i));
            b = J[(g + 28) >> 2];
            while (1) {
              d = ya((d - 12) | 0);
              if ((g | 0) != (d | 0)) {
                continue;
              }
              break;
            }
          }
          ka = (g + 32) | 0;
          return b | 0;
        }
        function aj(a, b, c, d, e, f) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          f = f | 0;
          var g = 0,
            h = 0,
            i = 0;
          g = (ka - 32) | 0;
          ka = g;
          J[(g + 28) >> 2] = b;
          a: {
            if (!(H[(d + 4) | 0] & 1)) {
              J[g >> 2] = -1;
              b = oa[J[(J[a >> 2] + 16) >> 2]](a, b, c, d, e, g) | 0;
              b: {
                switch (J[g >> 2]) {
                  case 0:
                    H[f | 0] = 0;
                    break a;
                  case 1:
                    H[f | 0] = 1;
                    break a;
                  default:
                    break b;
                }
              }
              H[f | 0] = 1;
              J[e >> 2] = 4;
              break a;
            }
            Ha(g, d);
            b = eb(g);
            Ka(J[g >> 2]);
            Ha(g, d);
            a = $b(g);
            Ka(J[g >> 2]);
            oa[J[(J[a >> 2] + 24) >> 2]](g, a);
            oa[J[(J[a >> 2] + 28) >> 2]](g | 12, a);
            d = (g + 24) | 0;
            ((h = f),
              (i = (tc((g + 28) | 0, c, g, d, b, e, 1) | 0) == (g | 0)),
              (H[h | 0] = i));
            b = J[(g + 28) >> 2];
            while (1) {
              d = ya((d - 12) | 0);
              if ((g | 0) != (d | 0)) {
                continue;
              }
              break;
            }
          }
          ka = (g + 32) | 0;
          return b | 0;
        }
        function Ve(a, b, c, d) {
          var e = 0,
            f = 0,
            g = 0,
            h = 0;
          e = (ka - 16) | 0;
          ka = e;
          a: {
            b: {
              if ((a | 0) != (b | 0)) {
                c: {
                  h = J[4158];
                  J[4158] = 0;
                  Xa();
                  f = We(a, (e + 12) | 0, d);
                  a = f;
                  d = na;
                  d: {
                    g = J[4158];
                    if (g) {
                      if (J[(e + 12) >> 2] != (b | 0)) {
                        break c;
                      }
                      if ((g | 0) != 68) {
                        break d;
                      }
                      J[c >> 2] = 4;
                      a = 2147483647;
                      if ((!!f & ((d | 0) >= 0)) | ((d | 0) > 0)) {
                        break a;
                      }
                      break b;
                    }
                    J[4158] = h;
                    if (J[(e + 12) >> 2] == (b | 0)) {
                      break d;
                    }
                    break c;
                  }
                  if (
                    (((d | 0) < 0) & (a >>> 0 <= 2147483647)) |
                    ((d | 0) < -1)
                  ) {
                    J[c >> 2] = 4;
                    break b;
                  }
                  if (
                    (((d | 0) >= 0) & (a >>> 0 >= 2147483648)) |
                    ((d | 0) > 0)
                  ) {
                    J[c >> 2] = 4;
                    a = 2147483647;
                    break a;
                  }
                  break a;
                }
              }
              J[c >> 2] = 4;
              a = 0;
              break a;
            }
            a = -2147483648;
          }
          ka = (e + 16) | 0;
          return a;
        }
        function Gb(a, b, c, d, e, f) {
          var g = 0,
            h = 0,
            i = 0,
            j = 0;
          a: {
            if (f & 64) {
              c = (f + -64) | 0;
              b = c & 31;
              if ((c & 63) >>> 0 >= 32) {
                c = 0;
                b = (e >>> b) | 0;
              } else {
                c = (e >>> b) | 0;
                b = ((((1 << b) - 1) & e) << (32 - b)) | (d >>> b);
              }
              d = 0;
              e = 0;
              break a;
            }
            if (!f) {
              break a;
            }
            i = d;
            h = (64 - f) | 0;
            g = h & 31;
            if ((h & 63) >>> 0 >= 32) {
              h = d << g;
              j = 0;
            } else {
              h = (((1 << g) - 1) & (i >>> (32 - g))) | (e << g);
              j = i << g;
            }
            i = b;
            b = f & 31;
            if ((f & 63) >>> 0 >= 32) {
              g = 0;
              b = (c >>> b) | 0;
            } else {
              g = (c >>> b) | 0;
              b = ((((1 << b) - 1) & c) << (32 - b)) | (i >>> b);
            }
            b = j | b;
            c = g | h;
            g = d;
            d = f & 31;
            if ((f & 63) >>> 0 >= 32) {
              h = 0;
              d = (e >>> d) | 0;
            } else {
              h = (e >>> d) | 0;
              d = ((((1 << d) - 1) & e) << (32 - d)) | (g >>> d);
            }
            e = h;
          }
          J[a >> 2] = b;
          J[(a + 4) >> 2] = c;
          J[(a + 8) >> 2] = d;
          J[(a + 12) >> 2] = e;
        }
        function nb(a, b) {
          var c = 0,
            d = 0,
            e = 0,
            f = 0,
            g = 0,
            h = 0,
            i = 0,
            j = 0;
          e = (ka - 16) | 0;
          ka = e;
          x(+b);
          d = s(1) | 0;
          f = s(0) | 0;
          j = d;
          c = d & 1048575;
          d = (d >>> 20) & 2047;
          a: {
            if (d | 0) {
              if (((d | 0) != 2047) | g) {
                h = ((c & 15) << 28) | (f >>> 4);
                i = (c >>> 4) | 0;
                g = (d + 15360) | 0;
                d = f << 28;
                c = 0;
                break a;
              }
              h = ((c & 15) << 28) | (f >>> 4);
              i = (c >>> 4) | 0;
              g = 32767;
              d = f << 28;
              c = 0;
              break a;
            }
            if (!(c | f)) {
              d = 0;
              c = 0;
              break a;
            }
            d = c;
            c = S(c);
            c = (c | 0) == 32 ? (S(f) + 32) | 0 : c;
            Ta(e, f, d, 0, 0, (c + 49) | 0);
            h = J[(e + 8) >> 2];
            i = J[(e + 12) >> 2] ^ 65536;
            g = (15372 - c) | 0;
            d = J[(e + 4) >> 2];
            c = J[e >> 2];
          }
          J[a >> 2] = c;
          J[(a + 4) >> 2] = d;
          J[(a + 8) >> 2] = h;
          J[(a + 12) >> 2] = i | ((j & -2147483648) | (g << 16));
          ka = (e + 16) | 0;
        }
        function ch(a) {
          a = a | 0;
          if (K[21268]) {
            return J[5316];
          }
          if (!K[22336]) {
            H[22336] = 1;
          }
          Da(22048, 13824);
          Da(22060, 13856);
          Da(22072, 13892);
          Da(22084, 13916);
          Da(22096, 13940);
          Da(22108, 13956);
          Da(22120, 13976);
          Da(22132, 13996);
          Da(22144, 14024);
          Da(22156, 14064);
          Da(22168, 14096);
          Da(22180, 14132);
          Da(22192, 14168);
          Da(22204, 14184);
          Da(22216, 14200);
          Da(22228, 14216);
          Da(22240, 13940);
          Da(22252, 14232);
          Da(22264, 14248);
          Da(22276, 14264);
          Da(22288, 14280);
          Da(22300, 14296);
          Da(22312, 14312);
          Da(22324, 14328);
          H[21268] = 1;
          J[5316] = 22048;
          return 22048;
        }
        function Vf(a, b) {
          var c = 0,
            d = 0,
            e = 0;
          a: {
            b: {
              c: {
                d = b & 255;
                if (d) {
                  if (a & 3) {
                    while (1) {
                      c = K[a | 0];
                      if (!c | ((c | 0) == (d | 0))) {
                        break a;
                      }
                      a = (a + 1) | 0;
                      if (a & 3) {
                        continue;
                      }
                      break;
                    }
                  }
                  c = J[a >> 2];
                  if (((c | (16843008 - c)) & -2139062144) != -2139062144) {
                    break c;
                  }
                  e = P(d, 16843009);
                  while (1) {
                    d = c ^ e;
                    if ((((16843008 - d) | d) & -2139062144) != -2139062144) {
                      break c;
                    }
                    c = J[(a + 4) >> 2];
                    d = (a + 4) | 0;
                    a = d;
                    if ((((16843008 - c) | c) & -2139062144) == -2139062144) {
                      continue;
                    }
                    break;
                  }
                  break b;
                }
                return (Sb(a) + a) | 0;
              }
              d = a;
            }
            while (1) {
              a = d;
              c = K[a | 0];
              if (!c) {
                break a;
              }
              d = (a + 1) | 0;
              if ((c | 0) != (b & 255)) {
                continue;
              }
              break;
            }
          }
          return a;
        }
        function Ta(a, b, c, d, e, f) {
          var g = 0,
            h = 0,
            i = 0;
          a: {
            if (f & 64) {
              e = (f + -64) | 0;
              f = b;
              d = e & 31;
              if ((e & 63) >>> 0 >= 32) {
                e = f << d;
                d = 0;
              } else {
                e = (((1 << d) - 1) & (f >>> (32 - d))) | (c << d);
                d = f << d;
              }
              b = 0;
              c = 0;
              break a;
            }
            if (!f) {
              break a;
            }
            h = d;
            g = f & 31;
            if ((f & 63) >>> 0 >= 32) {
              i = d << g;
              h = 0;
            } else {
              i = (((1 << g) - 1) & (h >>> (32 - g))) | (e << g);
              h = h << g;
            }
            g = b;
            e = (64 - f) | 0;
            d = e & 31;
            if ((e & 63) >>> 0 >= 32) {
              e = 0;
              d = (c >>> d) | 0;
            } else {
              e = (c >>> d) | 0;
              d = ((((1 << d) - 1) & c) << (32 - d)) | (g >>> d);
            }
            d = h | d;
            e = e | i;
            h = b;
            g = f & 31;
            if ((f & 63) >>> 0 >= 32) {
              i = b << g;
              b = 0;
            } else {
              i = (((1 << g) - 1) & (h >>> (32 - g))) | (c << g);
              b = h << g;
            }
            c = i;
          }
          J[a >> 2] = b;
          J[(a + 4) >> 2] = c;
          J[(a + 8) >> 2] = d;
          J[(a + 12) >> 2] = e;
        }
        function gd(a) {
          var b = 0,
            c = 0,
            d = 0,
            e = 0,
            f = 0,
            g = 0,
            h = 0,
            i = 0;
          b = Vf(a, 61);
          if ((b | 0) == (a | 0)) {
            return 0;
          }
          e = (b - a) | 0;
          a: {
            if (K[(e + a) | 0]) {
              break a;
            }
            d = J[5149];
            if (!d) {
              break a;
            }
            c = J[d >> 2];
            if (!c) {
              break a;
            }
            while (1) {
              b: {
                f = a;
                g = e;
                b = 0;
                c: {
                  if (!e) {
                    break c;
                  }
                  b = K[a | 0];
                  if (b) {
                    d: {
                      while (1) {
                        h = K[c | 0];
                        if (((h | 0) != (b | 0)) | !h) {
                          break d;
                        }
                        g = (g - 1) | 0;
                        if (!g) {
                          break d;
                        }
                        c = (c + 1) | 0;
                        b = K[(f + 1) | 0];
                        f = (f + 1) | 0;
                        if (b) {
                          continue;
                        }
                        break;
                      }
                      b = 0;
                    }
                  } else {
                    b = 0;
                  }
                  b = (b - K[c | 0]) | 0;
                }
                if (!b) {
                  b = (J[d >> 2] + e) | 0;
                  if (K[b | 0] == 61) {
                    break b;
                  }
                }
                c = J[(d + 4) >> 2];
                d = (d + 4) | 0;
                if (c) {
                  continue;
                }
                break a;
              }
              break;
            }
            i = (b + 1) | 0;
          }
          return i;
        }
        function Pb(a) {
          var b = 0,
            c = 0,
            d = 0;
          if (!a) {
            if (J[4094]) {
              b = Pb(J[4094]);
            }
            if (J[4132]) {
              b = Pb(J[4132]) | b;
            }
            a = J[4298];
            if (a) {
              while (1) {
                if (J[(a + 20) >> 2] != J[(a + 28) >> 2]) {
                  b = Pb(a) | b;
                }
                a = J[(a + 56) >> 2];
                if (a) {
                  continue;
                }
                break;
              }
            }
            return b;
          }
          d = J[(a + 76) >> 2] < 0;
          a: {
            b: {
              if (J[(a + 20) >> 2] == J[(a + 28) >> 2]) {
                break b;
              }
              oa[J[(a + 36) >> 2]](a, 0, 0) | 0;
              if (J[(a + 20) >> 2]) {
                break b;
              }
              b = -1;
              break a;
            }
            b = J[(a + 8) >> 2];
            c = J[(a + 4) >> 2];
            if ((b | 0) != (c | 0)) {
              b = (c - b) | 0;
              oa[J[(a + 40) >> 2]](a, b, b >> 31, 1) | 0;
            }
            b = 0;
            J[(a + 28) >> 2] = 0;
            J[(a + 16) >> 2] = 0;
            J[(a + 20) >> 2] = 0;
            J[(a + 4) >> 2] = 0;
            J[(a + 8) >> 2] = 0;
            if (d) {
              break a;
            }
          }
          return b;
        }
        function kf(a, b, c) {
          var d = 0,
            e = 0;
          d = (c | 0) != 0;
          a: {
            b: {
              c: {
                if (!(a & 3) | !c) {
                  break c;
                }
                e = b & 255;
                while (1) {
                  if ((e | 0) == K[a | 0]) {
                    break b;
                  }
                  c = (c - 1) | 0;
                  d = (c | 0) != 0;
                  a = (a + 1) | 0;
                  if (!(a & 3)) {
                    break c;
                  }
                  if (c) {
                    continue;
                  }
                  break;
                }
              }
              if (!d) {
                break a;
              }
              d = b & 255;
              if (!(((d | 0) == K[a | 0]) | (c >>> 0 < 4))) {
                d = P(d, 16843009);
                while (1) {
                  e = d ^ J[a >> 2];
                  if ((((16843008 - e) | e) & -2139062144) != -2139062144) {
                    break b;
                  }
                  a = (a + 4) | 0;
                  c = (c - 4) | 0;
                  if (c >>> 0 > 3) {
                    continue;
                  }
                  break;
                }
              }
              if (!c) {
                break a;
              }
            }
            b = b & 255;
            while (1) {
              if ((b | 0) == K[a | 0]) {
                return a;
              }
              a = (a + 1) | 0;
              c = (c - 1) | 0;
              if (c) {
                continue;
              }
              break;
            }
          }
          return 0;
        }
        function fh(a) {
          a = a | 0;
          if (K[21260]) {
            return J[5314];
          }
          if (!K[22032]) {
            H[22032] = 1;
          }
          Ea(21744, 1236);
          Ea(21756, 1227);
          Ea(21768, 1715);
          Ea(21780, 1684);
          Ea(21792, 1306);
          Ea(21804, 1771);
          Ea(21816, 1244);
          Ea(21828, 1420);
          Ea(21840, 1519);
          Ea(21852, 1502);
          Ea(21864, 1510);
          Ea(21876, 1529);
          Ea(21888, 1676);
          Ea(21900, 1846);
          Ea(21912, 1538);
          Ea(21924, 1475);
          Ea(21936, 1306);
          Ea(21948, 1664);
          Ea(21960, 1680);
          Ea(21972, 1721);
          Ea(21984, 1644);
          Ea(21996, 1427);
          Ea(22008, 1374);
          Ea(22020, 1836);
          H[21260] = 1;
          J[5314] = 21744;
          return 21744;
        }
        function Se(a, b, c, d) {
          var e = 0,
            f = 0,
            g = 0,
            h = 0;
          e = (ka - 16) | 0;
          ka = e;
          a: {
            b: {
              if ((a | 0) != (b | 0)) {
                c: {
                  d: {
                    f = K[a | 0];
                    if ((f | 0) != 45) {
                      break d;
                    }
                    a = (a + 1) | 0;
                    if ((b | 0) != (a | 0)) {
                      break d;
                    }
                    break c;
                  }
                  h = J[4158];
                  J[4158] = 0;
                  Xa();
                  a = bd(a, (e + 12) | 0, d);
                  d = na;
                  g = J[4158];
                  e: {
                    if (g) {
                      if (J[(e + 12) >> 2] != (b | 0)) {
                        break c;
                      }
                      if ((!d & (a >>> 0 > 65535)) | d | ((g | 0) == 68)) {
                        break e;
                      }
                      break b;
                    }
                    J[4158] = h;
                    if (J[(e + 12) >> 2] != (b | 0)) {
                      break c;
                    }
                    if (!d & (a >>> 0 < 65536)) {
                      break b;
                    }
                  }
                  J[c >> 2] = 4;
                  a = 65535;
                  break a;
                }
              }
              J[c >> 2] = 4;
              a = 0;
              break a;
            }
            a = (f | 0) == 45 ? (0 - a) | 0 : a;
          }
          ka = (e + 16) | 0;
          return a & 65535;
        }
        function Pe(a, b, c, d) {
          var e = 0,
            f = 0,
            g = 0,
            h = 0;
          e = (ka - 16) | 0;
          ka = e;
          a: {
            if ((a | 0) != (b | 0)) {
              b: {
                c: {
                  f = K[a | 0];
                  if ((f | 0) != 45) {
                    break c;
                  }
                  a = (a + 1) | 0;
                  if ((b | 0) != (a | 0)) {
                    break c;
                  }
                  break b;
                }
                h = J[4158];
                J[4158] = 0;
                Xa();
                a = bd(a, (e + 12) | 0, d);
                d = na;
                d: {
                  g = J[4158];
                  if (g) {
                    if (J[(e + 12) >> 2] != (b | 0)) {
                      break b;
                    }
                    if ((g | 0) != 68) {
                      break d;
                    }
                    J[c >> 2] = 4;
                    a = -1;
                    b = -1;
                    break a;
                  }
                  J[4158] = h;
                  if (J[(e + 12) >> 2] == (b | 0)) {
                    break d;
                  }
                  break b;
                }
                b = a;
                c = (f | 0) == 45;
                a = c ? (0 - b) | 0 : b;
                b = c ? (0 - ((d + ((b | 0) != 0)) | 0)) | 0 : d;
                break a;
              }
            }
            J[c >> 2] = 4;
            a = 0;
            b = 0;
          }
          ka = (e + 16) | 0;
          na = b;
          return a;
        }
        function lb(a, b, c, d, e) {
          var f = 0,
            g = 0,
            h = 0;
          g = (ka - 16) | 0;
          ka = g;
          J[(g + 12) >> 2] = b;
          a: {
            b: {
              if (Ma(a, (g + 12) | 0)) {
                b = 0;
                h = 6;
                break b;
              }
              b = 0;
              f = _b(a);
              h = 4;
              if (((f | 0) < 0) | !(K[(J[(d + 8) >> 2] + (f << 2)) | 0] & 64)) {
                break b;
              }
              b = oa[J[(J[d >> 2] + 36) >> 2]](d, f, 0) | 0;
              while (1) {
                c: {
                  sc(a);
                  b = (b - 48) | 0;
                  if (Ma(a, (g + 12) | 0) | ((e | 0) < 2)) {
                    break c;
                  }
                  f = _b(a);
                  if (
                    ((f | 0) < 0) |
                    !(K[(J[(d + 8) >> 2] + (f << 2)) | 0] & 64)
                  ) {
                    break a;
                  }
                  e = (e - 1) | 0;
                  b =
                    ((oa[J[(J[d >> 2] + 36) >> 2]](d, f, 0) | 0) + P(b, 10)) |
                    0;
                  continue;
                }
                break;
              }
              if (!Ma(a, (g + 12) | 0)) {
                break a;
              }
              h = 2;
            }
            J[c >> 2] = h | J[c >> 2];
          }
          ka = (g + 16) | 0;
          return b;
        }
        function Yj(a, b, c) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          var d = 0,
            e = 0,
            f = 0,
            g = 0;
          d = (ka - 32) | 0;
          ka = d;
          J[(d + 16) >> 2] = b;
          e = J[(a + 48) >> 2];
          J[(d + 20) >> 2] = c - ((e | 0) != 0);
          g = J[(a + 44) >> 2];
          J[(d + 28) >> 2] = e;
          J[(d + 24) >> 2] = g;
          a: {
            b: {
              if (ic(ea(J[(a + 60) >> 2], (d + 16) | 0, 2, (d + 12) | 0) | 0)) {
                b = 32;
              } else {
                e = J[(d + 12) >> 2];
                if ((e | 0) > 0) {
                  break b;
                }
                b = e ? 32 : 16;
              }
              J[a >> 2] = b | J[a >> 2];
              break a;
            }
            f = e;
            g = J[(d + 20) >> 2];
            if (g >>> 0 >= e >>> 0) {
              break a;
            }
            f = J[(a + 44) >> 2];
            J[(a + 4) >> 2] = f;
            J[(a + 8) >> 2] = f + ((e - g) | 0);
            if (J[(a + 48) >> 2]) {
              J[(a + 4) >> 2] = f + 1;
              H[(((b + c) | 0) - 1) | 0] = K[f | 0];
            }
            f = c;
          }
          ka = (d + 32) | 0;
          return f | 0;
        }
        function kb(a, b, c, d, e) {
          var f = 0,
            g = 0,
            h = 0;
          f = (ka - 16) | 0;
          ka = f;
          J[(f + 12) >> 2] = b;
          b = 0;
          g = 6;
          a: {
            b: {
              if (La(a, (f + 12) | 0)) {
                break b;
              }
              h = Xb(a);
              g = 4;
              if (!(oa[J[(J[d >> 2] + 12) >> 2]](d, 64, h) | 0)) {
                break b;
              }
              b = oa[J[(J[d >> 2] + 52) >> 2]](d, h, 0) | 0;
              while (1) {
                c: {
                  qc(a);
                  b = (b - 48) | 0;
                  if (La(a, (f + 12) | 0) | ((e | 0) < 2)) {
                    break c;
                  }
                  h = Xb(a);
                  if (!(oa[J[(J[d >> 2] + 12) >> 2]](d, 64, h) | 0)) {
                    break a;
                  }
                  e = (e - 1) | 0;
                  b =
                    ((oa[J[(J[d >> 2] + 52) >> 2]](d, h, 0) | 0) + P(b, 10)) |
                    0;
                  continue;
                }
                break;
              }
              if (!La(a, (f + 12) | 0)) {
                break a;
              }
              g = 2;
            }
            J[c >> 2] = g | J[c >> 2];
          }
          ka = (f + 16) | 0;
          return b;
        }
        function xc(a, b) {
          a: {
            if (a) {
              if (b >>> 0 <= 127) {
                break a;
              }
              b: {
                if (!J[J[4844] >> 2]) {
                  if ((b & -128) == 57216) {
                    break a;
                  }
                  break b;
                }
                if (b >>> 0 <= 2047) {
                  H[(a + 1) | 0] = (b & 63) | 128;
                  H[a | 0] = (b >>> 6) | 192;
                  return 2;
                }
                if (!(((b & -8192) != 57344) & (b >>> 0 >= 55296))) {
                  H[(a + 2) | 0] = (b & 63) | 128;
                  H[a | 0] = (b >>> 12) | 224;
                  H[(a + 1) | 0] = ((b >>> 6) & 63) | 128;
                  return 3;
                }
                if ((b - 65536) >>> 0 <= 1048575) {
                  H[(a + 3) | 0] = (b & 63) | 128;
                  H[a | 0] = (b >>> 18) | 240;
                  H[(a + 2) | 0] = ((b >>> 6) & 63) | 128;
                  H[(a + 1) | 0] = ((b >>> 12) & 63) | 128;
                  return 4;
                }
              }
              J[4158] = 25;
              a = -1;
            } else {
              a = 1;
            }
            return a;
          }
          H[a | 0] = b;
          return 1;
        }
        function gf(a, b, c, d, e) {
          var f = 0,
            g = 0,
            h = 0;
          h = -1;
          g = d & 2147483647;
          f = (g | 0) == 2147418112;
          a: {
            if (
              f & !c ? a | b : (f & ((c | 0) != 0)) | (g >>> 0 > 2147418112)
            ) {
              break a;
            }
            f = e & 2147483647;
            if ((f >>> 0 > 2147418112) & ((f | 0) != 2147418112)) {
              break a;
            }
            if (!(a | c | (f | g | b))) {
              return 0;
            }
            f = d & e;
            if ((f | 0) > 0) {
              f = 1;
            } else {
              f = (f | 0) >= 0;
            }
            if (f) {
              if (
                (((c | 0) != 0) | ((d | 0) != (e | 0))) &
                ((d | 0) < (e | 0))
              ) {
                break a;
              }
              return (a | c | ((d ^ e) | b)) != 0;
            }
            if (
              !c & ((d | 0) == (e | 0))
                ? a | b
                : (((c | 0) != 0) & ((d | 0) >= (e | 0))) | ((d | 0) > (e | 0))
            ) {
              break a;
            }
            h = (a | c | ((d ^ e) | b)) != 0;
          }
          return h;
        }
        function Sa(a, b, c, d, e, f, g, h, i) {
          var j = 0,
            k = 0,
            l = 0,
            m = 0;
          i = dk(b, c, h, i);
          h = na;
          e = dk(d, e, f, g);
          i = (e + i) | 0;
          d = (na + h) | 0;
          h = e >>> 0 > i >>> 0 ? (d + 1) | 0 : d;
          j = g;
          e = 0;
          k = c;
          d = 0;
          c = dk(g, e, c, d);
          g = (c + i) | 0;
          i = (na + h) | 0;
          l = g;
          c = c >>> 0 > g >>> 0 ? (i + 1) | 0 : i;
          g = dk(f, 0, b, 0);
          h = na;
          i = 0;
          d = dk(f, i, k, d);
          h = (h + d) | 0;
          f = (na + i) | 0;
          f = d >>> 0 > h >>> 0 ? (f + 1) | 0 : f;
          i = (f + l) | 0;
          d = c;
          f = f >>> 0 > i >>> 0 ? (d + 1) | 0 : d;
          b = (dk(b, m, j, e) + h) | 0;
          e = na;
          e = b >>> 0 < h >>> 0 ? (e + 1) | 0 : e;
          h = (e + i) | 0;
          i = f;
          J[(a + 8) >> 2] = h;
          J[(a + 12) >> 2] = e >>> 0 > h >>> 0 ? (i + 1) | 0 : i;
          J[a >> 2] = g;
          J[(a + 4) >> 2] = b;
        }
        function Qe(a, b, c, d) {
          var e = 0,
            f = 0,
            g = 0,
            h = 0;
          e = (ka - 16) | 0;
          ka = e;
          a: {
            b: {
              if ((a | 0) != (b | 0)) {
                c: {
                  d: {
                    f = K[a | 0];
                    if ((f | 0) != 45) {
                      break d;
                    }
                    a = (a + 1) | 0;
                    if ((b | 0) != (a | 0)) {
                      break d;
                    }
                    break c;
                  }
                  h = J[4158];
                  J[4158] = 0;
                  Xa();
                  a = bd(a, (e + 12) | 0, d);
                  d = na;
                  g = J[4158];
                  e: {
                    if (g) {
                      if (J[(e + 12) >> 2] != (b | 0)) {
                        break c;
                      }
                      if (((g | 0) == 68) | d) {
                        break e;
                      }
                      break b;
                    }
                    J[4158] = h;
                    if (J[(e + 12) >> 2] != (b | 0)) {
                      break c;
                    }
                    if (!d) {
                      break b;
                    }
                  }
                  J[c >> 2] = 4;
                  a = -1;
                  break a;
                }
              }
              J[c >> 2] = 4;
              a = 0;
              break a;
            }
            a = (f | 0) == 45 ? (0 - a) | 0 : a;
          }
          ka = (e + 16) | 0;
          return a;
        }
        function Gi(a, b, c, d, e) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          var f = 0;
          f = (ka - 16) | 0;
          ka = f;
          J[(f + 12) >> 2] = b;
          a: {
            if (!(H[(c + 4) | 0] & 1)) {
              c = oa[J[(J[a >> 2] + 24) >> 2]](a, b, c, d, e) | 0;
              break a;
            }
            Ha(f, c);
            a = $b(f);
            Ka(J[f >> 2]);
            oa[J[(J[a >> 2] + (e ? 24 : 28)) >> 2]](f, a);
            e = J[f >> 2];
            b = H[(f + 11) | 0];
            c = (b | 0) < 0 ? e : f;
            while (1) {
              a = (b << 24) >> 24 < 0;
              if (
                (((a ? e : f) + (a ? J[(f + 4) >> 2] : b & 255)) | 0) ==
                (c | 0)
              ) {
                c = J[(f + 12) >> 2];
                ya(f);
              } else {
                Ff((f + 12) | 0, H[c | 0]);
                c = (c + 1) | 0;
                e = J[f >> 2];
                b = K[(f + 11) | 0];
                continue;
              }
              break;
            }
          }
          ka = (f + 16) | 0;
          return c | 0;
        }
        function yf(a, b) {
          var c = 0,
            d = 0,
            e = 0,
            f = 0,
            g = 0;
          e = (ka - 16) | 0;
          ka = e;
          g = J[4844];
          if (J[(b + 72) >> 2] <= 0) {
            ld(b);
          }
          J[4844] = J[(b + 136) >> 2];
          c = -1;
          if (J[(b + 4) >> 2]) {
            d = 0;
          } else {
            hc(b);
            d = !J[(b + 4) >> 2];
          }
          a: {
            if (d | ((a | 0) == -1)) {
              break a;
            }
            d = xc((e + 12) | 0, a);
            if ((d | 0) < 0) {
              break a;
            }
            f = J[(b + 4) >> 2];
            if (f >>> 0 < (((J[(b + 44) >> 2] + d) | 0) - 8) >>> 0) {
              break a;
            }
            b: {
              if (a >>> 0 <= 127) {
                c = (f - 1) | 0;
                J[(b + 4) >> 2] = c;
                H[c | 0] = a;
                break b;
              }
              c = (f - d) | 0;
              J[(b + 4) >> 2] = c;
              vb(c, (e + 12) | 0, d);
            }
            J[b >> 2] = J[b >> 2] & -17;
            c = a;
          }
          J[4844] = g;
          ka = (e + 16) | 0;
          return c;
        }
        function Vc(a, b, c, d, e, f) {
          var g = 0,
            h = 0,
            i = 0,
            j = 0;
          i = (ka - 16) | 0;
          ka = i;
          a: {
            if (!a) {
              break a;
            }
            g = J[(e + 12) >> 2];
            h = (c - b) >> 2;
            if ((h | 0) > 0) {
              if ((oa[J[(J[a >> 2] + 48) >> 2]](a, b, h) | 0) != (h | 0)) {
                break a;
              }
            }
            h = (d - b) >> 2;
            if ((h | 0) < (g | 0)) {
              b = (i + 4) | 0;
              g = (g - h) | 0;
              Sd(b, g, f);
              f =
                oa[J[(J[a >> 2] + 48) >> 2]](
                  a,
                  H[(i + 15) | 0] < 0 ? J[(i + 4) >> 2] : b,
                  g,
                ) | 0;
              ya(b);
              if ((f | 0) != (g | 0)) {
                break a;
              }
            }
            b = (d - c) >> 2;
            if ((b | 0) > 0) {
              if ((oa[J[(J[a >> 2] + 48) >> 2]](a, c, b) | 0) != (b | 0)) {
                break a;
              }
            }
            J[(e + 12) >> 2] = 0;
            j = a;
          }
          ka = (i + 16) | 0;
          return j;
        }
        function jc(a, b, c, d, e, f) {
          var g = 0,
            h = 0,
            i = 0,
            j = 0;
          i = (ka - 16) | 0;
          ka = i;
          a: {
            if (!a) {
              break a;
            }
            g = J[(e + 12) >> 2];
            h = (c - b) | 0;
            if ((h | 0) > 0) {
              if ((oa[J[(J[a >> 2] + 48) >> 2]](a, b, h) | 0) != (h | 0)) {
                break a;
              }
            }
            h = (d - b) | 0;
            if ((h | 0) < (g | 0)) {
              b = (i + 4) | 0;
              g = (g - h) | 0;
              Td(b, g, f);
              f =
                oa[J[(J[a >> 2] + 48) >> 2]](
                  a,
                  H[(i + 15) | 0] < 0 ? J[(i + 4) >> 2] : b,
                  g,
                ) | 0;
              ya(b);
              if ((f | 0) != (g | 0)) {
                break a;
              }
            }
            b = (d - c) | 0;
            if ((b | 0) > 0) {
              if ((oa[J[(J[a >> 2] + 48) >> 2]](a, c, b) | 0) != (b | 0)) {
                break a;
              }
            }
            J[(e + 12) >> 2] = 0;
            j = a;
          }
          ka = (i + 16) | 0;
          return j;
        }
        function Tf(a, b, c, d) {
          var e = 0,
            f = 0;
          a: {
            if (d >>> 0 >= 3) {
              J[4158] = 28;
              break a;
            }
            b: {
              if ((d | 0) != 1) {
                break b;
              }
              e = J[(a + 8) >> 2];
              if (!e) {
                break b;
              }
              f = b;
              e = (e - J[(a + 4) >> 2]) | 0;
              b = (b - e) | 0;
              c = (c - (((e >> 31) + (e >>> 0 > f >>> 0)) | 0)) | 0;
            }
            if (J[(a + 20) >> 2] != J[(a + 28) >> 2]) {
              oa[J[(a + 36) >> 2]](a, 0, 0) | 0;
              if (!J[(a + 20) >> 2]) {
                break a;
              }
            }
            J[(a + 28) >> 2] = 0;
            J[(a + 16) >> 2] = 0;
            J[(a + 20) >> 2] = 0;
            oa[J[(a + 40) >> 2]](a, b, c, d) | 0;
            if ((na | 0) < 0) {
              break a;
            }
            J[(a + 4) >> 2] = 0;
            J[(a + 8) >> 2] = 0;
            J[a >> 2] = J[a >> 2] & -17;
            return 0;
          }
          return -1;
        }
        function td(a, b, c) {
          var d = 0,
            e = 0,
            f = 0;
          d = J[(c + 16) >> 2];
          a: {
            if (!d) {
              if (Qf(c)) {
                break a;
              }
              d = J[(c + 16) >> 2];
            }
            e = J[(c + 20) >> 2];
            if ((d - e) >>> 0 < b >>> 0) {
              return oa[J[(c + 36) >> 2]](c, a, b) | 0;
            }
            b: {
              c: {
                if (!b | (J[(c + 80) >> 2] < 0)) {
                  break c;
                }
                d = b;
                while (1) {
                  f = (a + d) | 0;
                  if (K[(f - 1) | 0] != 10) {
                    d = (d - 1) | 0;
                    if (d) {
                      continue;
                    }
                    break c;
                  }
                  break;
                }
                e = oa[J[(c + 36) >> 2]](c, a, d) | 0;
                if (e >>> 0 < d >>> 0) {
                  break a;
                }
                b = (b - d) | 0;
                e = J[(c + 20) >> 2];
                break b;
              }
              f = a;
              d = 0;
            }
            vb(e, f, b);
            J[(c + 20) >> 2] = J[(c + 20) >> 2] + b;
            e = (b + d) | 0;
          }
          return e;
        }
        function zb(a, b, c) {
          var d = 0,
            e = 0,
            f = 0,
            g = 0;
          f = (ka - 16) | 0;
          ka = f;
          J[(a + 4) >> 2] = 0;
          g = (ka - 16) | 0;
          ka = g;
          H[(f + 15) | 0] = 0;
          d = J[a >> 2];
          e = (J[(d - 12) >> 2] + a) | 0;
          a: {
            if (!J[(e + 16) >> 2]) {
              e = J[(e + 72) >> 2];
              if (e) {
                gc(e);
                d = J[a >> 2];
              }
              H[(f + 15) | 0] = !J[(((J[(d - 12) >> 2] + a) | 0) + 16) >> 2];
              break a;
            }
            ob(e, 4);
          }
          ka = (g + 16) | 0;
          d = 4;
          if (K[(f + 15) | 0] == 1) {
            d = J[(((J[(J[a >> 2] - 12) >> 2] + a) | 0) + 24) >> 2];
            b = oa[J[(J[d >> 2] + 32) >> 2]](d, b, c) | 0;
            J[(a + 4) >> 2] = b;
            d = (b | 0) != (c | 0) ? 6 : 0;
          }
          ob((J[(J[a >> 2] - 12) >> 2] + a) | 0, d);
          ka = (f + 16) | 0;
        }
        function Fd(a, b) {
          var c = 0,
            d = 0,
            e = 0,
            f = 0,
            g = 0,
            h = 0;
          g = J[(a + 8) >> 2];
          h = J[(a + 12) >> 2];
          e = J[(a + 12) >> 2];
          d = P(b, 7);
          b = d & 31;
          if ((d & 63) >>> 0 >= 32) {
            f = 1 << b;
            b = 0;
          } else {
            c = 1 << b;
            f = (c - 1) & (1 >>> (32 - b));
            b = c;
          }
          c = (b + J[(a + 8) >> 2]) | 0;
          e = (e + f) | 0;
          e = b >>> 0 > c >>> 0 ? (e + 1) | 0 : e;
          b = a;
          f = c;
          c = d & 31;
          if ((d & 63) >>> 0 >= 32) {
            d = 63 << c;
            c = 0;
          } else {
            d = ((1 << c) - 1) & (63 >>> (32 - c));
            c = 63 << c;
          }
          J[(a + 8) >> 2] = (f & c) | g;
          J[(b + 12) >> 2] = (e & d) | h;
          b = J[(a + 4) >> 2] ^ h;
          J[a >> 2] = J[a >> 2] ^ g;
          J[(a + 4) >> 2] = b;
          J[(a + 16) >> 2] = J[(a + 16) >> 2] + 1;
        }
        function Va(a, b, c, d) {
          var e = 0,
            f = 0,
            g = 0;
          a: {
            if (((c - b) | 0) < 5) {
              break a;
            }
            e = H[(a + 11) | 0];
            if (!((e | 0) < 0 ? J[(a + 4) >> 2] : e)) {
              break a;
            }
            Uc(b, c);
            f = H[(a + 11) | 0];
            g = (f | 0) < 0;
            e = g ? J[a >> 2] : a;
            g = (e + (g ? J[(a + 4) >> 2] : f)) | 0;
            a = (c - 4) | 0;
            b: {
              while (1) {
                c: {
                  c = K[e | 0];
                  f = (c - 1) | 0;
                  if (a >>> 0 <= b >>> 0) {
                    break c;
                  }
                  if (((c | 0) != J[b >> 2]) & ((f & 255) >>> 0 <= 125)) {
                    break b;
                  }
                  b = (b + 4) | 0;
                  e = ((((g - e) | 0) > 1) + e) | 0;
                  continue;
                }
                break;
              }
              if (((f & 255) >>> 0 > 125) | (c >>> 0 > (J[a >> 2] - 1) >>> 0)) {
                break a;
              }
            }
            J[d >> 2] = 4;
          }
        }
        function Oe(a, b, c) {
          var d = 0,
            e = 0,
            f = Q(0),
            g = 0;
          e = (ka - 16) | 0;
          ka = e;
          a: {
            b: {
              c: {
                if ((a | 0) != (b | 0)) {
                  g = J[4158];
                  J[4158] = 0;
                  Xa();
                  d = (ka - 16) | 0;
                  ka = d;
                  ad(d, a, (e + 12) | 0, 0);
                  f = _e(
                    J[d >> 2],
                    J[(d + 4) >> 2],
                    J[(d + 8) >> 2],
                    J[(d + 12) >> 2],
                  );
                  ka = (d + 16) | 0;
                  d: {
                    a = J[4158];
                    if (a) {
                      if (J[(e + 12) >> 2] == (b | 0)) {
                        break d;
                      }
                      break c;
                    }
                    J[4158] = g;
                    if (J[(e + 12) >> 2] != (b | 0)) {
                      break c;
                    }
                    break a;
                  }
                  if ((a | 0) != 68) {
                    break a;
                  }
                  break b;
                }
                J[c >> 2] = 4;
                break a;
              }
              f = Q(0);
            }
            J[c >> 2] = 4;
          }
          ka = (e + 16) | 0;
          return f;
        }
        function Ne(a, b, c) {
          var d = 0,
            e = 0,
            f = 0,
            g = 0;
          e = (ka - 16) | 0;
          ka = e;
          a: {
            b: {
              c: {
                if ((a | 0) != (b | 0)) {
                  g = J[4158];
                  J[4158] = 0;
                  Xa();
                  d = (ka - 16) | 0;
                  ka = d;
                  ad(d, a, (e + 12) | 0, 1);
                  f = fd(
                    J[d >> 2],
                    J[(d + 4) >> 2],
                    J[(d + 8) >> 2],
                    J[(d + 12) >> 2],
                  );
                  ka = (d + 16) | 0;
                  d: {
                    a = J[4158];
                    if (a) {
                      if (J[(e + 12) >> 2] == (b | 0)) {
                        break d;
                      }
                      break c;
                    }
                    J[4158] = g;
                    if (J[(e + 12) >> 2] != (b | 0)) {
                      break c;
                    }
                    break a;
                  }
                  if ((a | 0) != 68) {
                    break a;
                  }
                  break b;
                }
                J[c >> 2] = 4;
                break a;
              }
              f = 0;
            }
            J[c >> 2] = 4;
          }
          ka = (e + 16) | 0;
          return f;
        }
        function Rj(a, b, c) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          var d = 0,
            e = 0,
            f = 0,
            g = 0;
          while (1) {
            a: {
              if ((c | 0) <= (g | 0)) {
                break a;
              }
              e = J[(a + 12) >> 2];
              d = J[(a + 16) >> 2];
              b: {
                if (e >>> 0 < d >>> 0) {
                  f = (c - g) | 0;
                  d = (d - e) >> 2;
                  d = (d | 0) > (f | 0) ? f : d;
                  if (d) {
                    f = d << 2;
                    if (f) {
                      z(b, e, f);
                    }
                    f = J[(a + 12) >> 2];
                  } else {
                    f = e;
                  }
                  e = d << 2;
                  J[(a + 12) >> 2] = f + e;
                  b = (b + e) | 0;
                  break b;
                }
                e = oa[J[(J[a >> 2] + 40) >> 2]](a) | 0;
                if ((e | 0) == -1) {
                  break a;
                }
                J[b >> 2] = e;
                d = 1;
                b = (b + 4) | 0;
              }
              g = (d + g) | 0;
              continue;
            }
            break;
          }
          return g | 0;
        }
        function zg(a, b, c, d, e) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          a: {
            if (pb(a, J[(b + 8) >> 2], e)) {
              if ((J[(b + 28) >> 2] == 1) | (J[(b + 4) >> 2] != (c | 0))) {
                break a;
              }
              J[(b + 28) >> 2] = d;
              return;
            }
            if (!pb(a, J[b >> 2], e)) {
              break a;
            }
            if (
              !((J[(b + 16) >> 2] != (c | 0)) & (J[(b + 20) >> 2] != (c | 0)))
            ) {
              if ((d | 0) != 1) {
                break a;
              }
              J[(b + 32) >> 2] = 1;
              return;
            }
            J[(b + 20) >> 2] = c;
            J[(b + 32) >> 2] = d;
            J[(b + 40) >> 2] = J[(b + 40) >> 2] + 1;
            if (!((J[(b + 36) >> 2] != 1) | (J[(b + 24) >> 2] != 2))) {
              H[(b + 54) | 0] = 1;
            }
            J[(b + 44) >> 2] = 4;
          }
        }
        function Pj(a, b, c) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          var d = 0,
            e = 0,
            f = 0,
            g = 0;
          while (1) {
            a: {
              if ((c | 0) <= (g | 0)) {
                break a;
              }
              f = J[(a + 24) >> 2];
              d = J[(a + 28) >> 2];
              if (f >>> 0 >= d >>> 0) {
                if ((oa[J[(J[a >> 2] + 52) >> 2]](a, J[b >> 2]) | 0) == -1) {
                  break a;
                }
                g = (g + 1) | 0;
                b = (b + 4) | 0;
              } else {
                e = (c - g) | 0;
                d = (d - f) >> 2;
                d = (d | 0) > (e | 0) ? e : d;
                if (d) {
                  e = d << 2;
                  if (e) {
                    z(f, b, e);
                  }
                  e = J[(a + 24) >> 2];
                } else {
                  e = f;
                }
                f = d << 2;
                J[(a + 24) >> 2] = e + f;
                g = (d + g) | 0;
                b = (b + f) | 0;
              }
              continue;
            }
            break;
          }
          return g | 0;
        }
        function xh(a, b, c, d, e) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          var f = 0,
            g = 0,
            h = 0,
            i = 0,
            j = 0,
            k = 0,
            l = 0;
          while (1) {
            a: {
              if (((c | 0) == (d | 0)) | (e >>> 0 <= h >>> 0)) {
                break a;
              }
              g = 1;
              f = (ka - 16) | 0;
              ka = f;
              ((k = f), (l = tb(J[(a + 8) >> 2])), (J[(k + 12) >> 2] = l));
              i = bc(0, c, (d - c) | 0, b ? b : 20812);
              wb((f + 12) | 0);
              ka = (f + 16) | 0;
              b: {
                switch ((i + 2) | 0) {
                  default:
                    g = i;
                    break;
                  case 0:
                  case 1:
                    break a;
                  case 2:
                    break b;
                }
              }
              h = (h + 1) | 0;
              j = (g + j) | 0;
              c = (c + g) | 0;
              continue;
            }
            break;
          }
          return j | 0;
        }
        function $h(a, b, c, d, e, f) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          f = f | 0;
          a: {
            if (H[(f + 11) | 0] >= 0) {
              J[(a + 8) >> 2] = J[(f + 8) >> 2];
              b = J[(f + 4) >> 2];
              J[a >> 2] = J[f >> 2];
              J[(a + 4) >> 2] = b;
              break a;
            }
            d = J[f >> 2];
            b: {
              c: {
                c = J[(f + 4) >> 2];
                d: {
                  if (c >>> 0 <= 1) {
                    H[(a + 11) | 0] = c;
                    break d;
                  }
                  if (c >>> 0 >= 1073741815) {
                    break c;
                  }
                  e = c | 1;
                  b = Jb((e + 1) | 0);
                  J[(a + 8) >> 2] = e - 2147483647;
                  J[a >> 2] = b;
                  J[(a + 4) >> 2] = c;
                  a = b;
                }
                b = ((c << 2) + 4) | 0;
                if (b) {
                  z(a, d, b);
                }
                break b;
              }
              Oa();
              y();
            }
          }
        }
        function Ij(a, b, c, d) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          a: {
            b: {
              if (J[(b + 64) >> 2]) {
                if (!(oa[J[(J[b >> 2] + 24) >> 2]](b) | 0)) {
                  break b;
                }
              }
              break a;
            }
            if (Sf(J[(b + 64) >> 2], J[(c + 8) >> 2], J[(c + 12) >> 2], 0)) {
              break a;
            }
            d = J[(c + 4) >> 2];
            J[(b + 72) >> 2] = J[c >> 2];
            J[(b + 76) >> 2] = d;
            b = J[(c + 12) >> 2];
            J[(a + 8) >> 2] = J[(c + 8) >> 2];
            J[(a + 12) >> 2] = b;
            b = J[(c + 4) >> 2];
            J[a >> 2] = J[c >> 2];
            J[(a + 4) >> 2] = b;
            return;
          }
          J[(a + 8) >> 2] = -1;
          J[(a + 12) >> 2] = -1;
          J[a >> 2] = 0;
          J[(a + 4) >> 2] = 0;
        }
        function kj(a, b, c) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          var d = 0,
            e = 0,
            f = 0,
            g = 0,
            h = 0;
          e = J[(a + 84) >> 2];
          f = J[e >> 2];
          d = J[(e + 4) >> 2];
          h = J[(a + 28) >> 2];
          g = (J[(a + 20) >> 2] - h) | 0;
          g = d >>> 0 < g >>> 0 ? d : g;
          if (g) {
            vb(f, h, g);
            f = (g + J[e >> 2]) | 0;
            J[e >> 2] = f;
            d = (J[(e + 4) >> 2] - g) | 0;
            J[(e + 4) >> 2] = d;
          }
          d = c >>> 0 > d >>> 0 ? d : c;
          if (d) {
            vb(f, b, d);
            f = (d + J[e >> 2]) | 0;
            J[e >> 2] = f;
            J[(e + 4) >> 2] = J[(e + 4) >> 2] - d;
          }
          H[f | 0] = 0;
          b = J[(a + 44) >> 2];
          J[(a + 28) >> 2] = b;
          J[(a + 20) >> 2] = b;
          return c | 0;
        }
        function Te(a, b, c, d) {
          var e = 0,
            f = 0,
            g = 0;
          e = (ka - 16) | 0;
          ka = e;
          a: {
            if ((a | 0) != (b | 0)) {
              g = J[4158];
              J[4158] = 0;
              Xa();
              a = We(a, (e + 12) | 0, d);
              d = na;
              f = J[4158];
              b: {
                if (f) {
                  if (J[(e + 12) >> 2] != (b | 0)) {
                    break b;
                  }
                  if ((f | 0) != 68) {
                    break a;
                  }
                  J[c >> 2] = 4;
                  b = (!!a & ((d | 0) >= 0)) | ((d | 0) > 0);
                  a = b ? -1 : 0;
                  d = b ? 2147483647 : -2147483648;
                  break a;
                }
                J[4158] = g;
                if (J[(e + 12) >> 2] == (b | 0)) {
                  break a;
                }
              }
            }
            J[c >> 2] = 4;
            a = 0;
            d = 0;
          }
          ka = (e + 16) | 0;
          na = d;
          return a;
        }
        function xd(a, b, c) {
          var d = 0,
            e = 0,
            f = 0,
            g = 0,
            h = 0;
          c = P(c, 7);
          d = c & 31;
          if ((c & 63) >>> 0 >= 32) {
            c = 1 << d;
            e = 0;
          } else {
            e = 1 << d;
            c = (e - 1) & (1 >>> (32 - d));
          }
          f = e;
          while (1) {
            e = J[(a + 8) >> 2];
            h = J[(a + 12) >> 2];
            d = dk(J[b >> 2], J[(b + 4) >> 2], 3, 0);
            J[b >> 2] = d;
            g = na;
            J[(b + 4) >> 2] = g;
            if ((e & f) | (c & h)) {
              h = (f & J[a >> 2]) | (c & J[(a + 4) >> 2]) ? 1 : 2;
              e = g;
              g = d;
              d = (d + h) | 0;
              e = g >>> 0 > d >>> 0 ? (e + 1) | 0 : e;
              J[b >> 2] = d;
              J[(b + 4) >> 2] = e;
              d = f;
              c = (c << 1) | (d >>> 31);
              f = d << 1;
              continue;
            }
            break;
          }
        }
        function oe(a) {
          a = a | 0;
          var b = 0,
            c = 0,
            d = 0,
            e = 0;
          J[a >> 2] = 7768;
          d = (a + 8) | 0;
          while (1) {
            b = J[(a + 8) >> 2];
            if (((J[(a + 12) >> 2] - b) >> 2) >>> 0 > c >>> 0) {
              b = J[(b + (c << 2)) >> 2];
              a: {
                if (!b) {
                  break a;
                }
                e = J[(b + 4) >> 2];
                J[(b + 4) >> 2] = e - 1;
                if (e) {
                  break a;
                }
                oa[J[(J[b >> 2] + 8) >> 2]](b);
              }
              c = (c + 1) | 0;
              continue;
            }
            break;
          }
          ya((a + 144) | 0);
          b = (ka - 16) | 0;
          ka = b;
          J[(b + 12) >> 2] = d;
          c = J[(b + 12) >> 2];
          d = J[c >> 2];
          if (d) {
            J[(c + 4) >> 2] = d;
            Vd((c + 12) | 0, d);
          }
          ka = (b + 16) | 0;
          return a | 0;
        }
        function Kc(a, b, c, d) {
          H[(a + 53) | 0] = 1;
          a: {
            if (J[(a + 4) >> 2] != (c | 0)) {
              break a;
            }
            H[(a + 52) | 0] = 1;
            c = J[(a + 16) >> 2];
            b: {
              if (!c) {
                J[(a + 36) >> 2] = 1;
                J[(a + 24) >> 2] = d;
                J[(a + 16) >> 2] = b;
                if ((d | 0) != 1) {
                  break a;
                }
                if (J[(a + 48) >> 2] == 1) {
                  break b;
                }
                break a;
              }
              if ((b | 0) == (c | 0)) {
                c = J[(a + 24) >> 2];
                if ((c | 0) == 2) {
                  J[(a + 24) >> 2] = d;
                  c = d;
                }
                if (J[(a + 48) >> 2] != 1) {
                  break a;
                }
                if ((c | 0) == 1) {
                  break b;
                }
                break a;
              }
              J[(a + 36) >> 2] = J[(a + 36) >> 2] + 1;
            }
            H[(a + 54) | 0] = 1;
          }
        }
        function rf(a) {
          a = a | 0;
          var b = 0,
            c = 0,
            d = 0,
            e = 0,
            f = 0,
            g = 0;
          b = (ka - 16) | 0;
          ka = b;
          e = (b + 16) | 0;
          a: {
            while (1) {
              d = J[(a + 36) >> 2];
              c = (b + 8) | 0;
              f =
                oa[J[(J[d >> 2] + 20) >> 2]](
                  d,
                  J[(a + 40) >> 2],
                  c,
                  e,
                  (b + 4) | 0,
                ) | 0;
              d = -1;
              g = c;
              c = (J[(b + 4) >> 2] - c) | 0;
              if ((ab(g, 1, c, J[(a + 32) >> 2]) | 0) != (c | 0)) {
                break a;
              }
              b: {
                switch ((f - 1) | 0) {
                  case 1:
                    break a;
                  case 0:
                    continue;
                  default:
                    break b;
                }
              }
              break;
            }
            d = Pb(J[(a + 32) >> 2]) ? -1 : 0;
          }
          ka = (b + 16) | 0;
          return d | 0;
        }
        function Tb(a, b) {
          var c = 0,
            d = 0,
            e = 0,
            f = 0;
          if (H[(b + 11) | 0] >= 0) {
            J[(a + 8) >> 2] = J[(b + 8) >> 2];
            c = J[(b + 4) >> 2];
            J[a >> 2] = J[b >> 2];
            J[(a + 4) >> 2] = c;
            return a;
          }
          c = a;
          f = J[b >> 2];
          a: {
            b: {
              d = J[(b + 4) >> 2];
              c: {
                if (d >>> 0 <= 10) {
                  H[(a + 11) | 0] = d;
                  break c;
                }
                if (d >>> 0 >= 2147483639) {
                  break b;
                }
                e = d | 7;
                b = za((e + 1) | 0);
                J[(c + 8) >> 2] = e - 2147483647;
                J[c >> 2] = b;
                J[(c + 4) >> 2] = d;
                c = b;
              }
              b = (d + 1) | 0;
              if (b) {
                z(c, f, b);
              }
              break a;
            }
            Oa();
            y();
          }
          return a;
        }
        function Bc(a, b) {
          var c = 0,
            d = 0,
            e = 0,
            f = 0,
            g = 0,
            h = 0,
            i = 0,
            j = 0,
            k = 0;
          d = (ka - 16) | 0;
          ka = d;
          Cc((d + 8) | 0, a);
          a: {
            if (K[(d + 8) | 0] != 1) {
              break a;
            }
            c = (d + 4) | 0;
            Ha(c, (J[(J[a >> 2] - 12) >> 2] + a) | 0);
            e = gb(c, 20848);
            fb(c);
            c = (J[(J[a >> 2] - 12) >> 2] + a) | 0;
            if (
              ((g = e),
              (h = J[(c + 24) >> 2]),
              (i = c),
              (j = zd(c)),
              (k = b),
              (f = J[(J[e >> 2] + 16) >> 2]),
              oa[f](g | 0, h | 0, i | 0, j | 0, k | 0) | 0)
            ) {
              break a;
            }
            ob((J[(J[a >> 2] - 12) >> 2] + a) | 0, 5);
          }
          fc((d + 8) | 0);
          ka = (d + 16) | 0;
          return a;
        }
        function hh(a) {
          a = a | 0;
          if (K[21252]) {
            return J[5312];
          }
          if (!K[21736]) {
            H[21736] = 1;
          }
          Da(21568, 13484);
          Da(21580, 13512);
          Da(21592, 13540);
          Da(21604, 13572);
          Da(21616, 13612);
          Da(21628, 13648);
          Da(21640, 13676);
          Da(21652, 13712);
          Da(21664, 13728);
          Da(21676, 13744);
          Da(21688, 13760);
          Da(21700, 13776);
          Da(21712, 13792);
          Da(21724, 13808);
          H[21252] = 1;
          J[5312] = 21568;
          return 21568;
        }
        function Vj(a, b, c) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          var d = 0,
            e = 0,
            f = 0,
            g = 0;
          while (1) {
            a: {
              if ((c | 0) <= (f | 0)) {
                break a;
              }
              e = J[(a + 12) >> 2];
              d = J[(a + 16) >> 2];
              b: {
                if (e >>> 0 < d >>> 0) {
                  g = (c - f) | 0;
                  d = (d - e) | 0;
                  d = (d | 0) > (g | 0) ? g : d;
                  if (d) {
                    if (d) {
                      z(b, e, d);
                    }
                    e = J[(a + 12) >> 2];
                  }
                  J[(a + 12) >> 2] = d + e;
                  break b;
                }
                e = oa[J[(J[a >> 2] + 40) >> 2]](a) | 0;
                if ((e | 0) == -1) {
                  break a;
                }
                H[b | 0] = e;
                d = 1;
              }
              b = (b + d) | 0;
              f = (d + f) | 0;
              continue;
            }
            break;
          }
          return f | 0;
        }
        function Tj(a, b, c) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          var d = 0,
            e = 0,
            f = 0,
            g = 0;
          while (1) {
            a: {
              if ((c | 0) <= (e | 0)) {
                break a;
              }
              f = J[(a + 24) >> 2];
              d = J[(a + 28) >> 2];
              if (f >>> 0 >= d >>> 0) {
                if ((oa[J[(J[a >> 2] + 52) >> 2]](a, K[b | 0]) | 0) == -1) {
                  break a;
                }
                e = (e + 1) | 0;
                b = (b + 1) | 0;
              } else {
                g = (c - e) | 0;
                d = (d - f) | 0;
                d = (d | 0) > (g | 0) ? g : d;
                if (d) {
                  if (d) {
                    z(f, b, d);
                  }
                  f = J[(a + 24) >> 2];
                }
                J[(a + 24) >> 2] = d + f;
                e = (d + e) | 0;
                b = (b + d) | 0;
              }
              continue;
            }
            break;
          }
          return e | 0;
        }
        function nd(a) {
          var b = 0,
            c = 0;
          c = (ka - 16) | 0;
          ka = c;
          if (J[(((J[(J[a >> 2] - 12) >> 2] + a) | 0) + 24) >> 2]) {
            J[(c + 12) >> 2] = a;
            H[(c + 8) | 0] = 0;
            b = (J[(J[a >> 2] - 12) >> 2] + a) | 0;
            if (!J[(b + 16) >> 2]) {
              b = J[(b + 72) >> 2];
              if (b) {
                nd(b);
              }
              H[(c + 8) | 0] = 1;
            }
            a: {
              if (K[(c + 8) | 0] != 1) {
                break a;
              }
              b = J[(((J[(J[a >> 2] - 12) >> 2] + a) | 0) + 24) >> 2];
              if ((oa[J[(J[b >> 2] + 24) >> 2]](b) | 0) != -1) {
                break a;
              }
              ob((J[(J[a >> 2] - 12) >> 2] + a) | 0, 1);
            }
            fc((c + 8) | 0);
          }
          ka = (c + 16) | 0;
        }
        function Rf(a, b, c) {
          var d = 0,
            e = 0,
            f = 0;
          d = J[(c + 72) >> 2];
          J[(c + 72) >> 2] = (d - 1) | d;
          d = J[(c + 4) >> 2];
          e = J[(c + 8) >> 2];
          if ((d | 0) == (e | 0)) {
            d = b;
          } else {
            f = d;
            d = (e - d) | 0;
            d = b >>> 0 > d >>> 0 ? d : b;
            vb(a, f, d);
            J[(c + 4) >> 2] = d + J[(c + 4) >> 2];
            a = (a + d) | 0;
            d = (b - d) | 0;
          }
          if (d) {
            while (1) {
              a: {
                if (!hc(c)) {
                  e = oa[J[(c + 32) >> 2]](c, a, d) | 0;
                  if (e) {
                    break a;
                  }
                }
                return (b - d) | 0;
              }
              a = (a + e) | 0;
              d = (d - e) | 0;
              if (d) {
                continue;
              }
              break;
            }
          }
          return b;
        }
        function jh(a) {
          a = a | 0;
          if (K[21244]) {
            return J[5310];
          }
          if (!K[21560]) {
            H[21560] = 1;
          }
          Ea(21392, 1285);
          Ea(21404, 1292);
          Ea(21416, 1258);
          Ea(21428, 1266);
          Ea(21440, 1249);
          Ea(21452, 1299);
          Ea(21464, 1276);
          Ea(21476, 1660);
          Ea(21488, 1668);
          Ea(21500, 1761);
          Ea(21512, 1823);
          Ea(21524, 1378);
          Ea(21536, 1690);
          Ea(21548, 1431);
          H[21244] = 1;
          J[5310] = 21392;
          return 21392;
        }
        function Cf(a) {
          var b = 0,
            c = 0,
            d = 0,
            e = 0,
            f = 0,
            g = 0;
          b = J[(a + 64) >> 2];
          if (!b) {
            return 0;
          }
          e = oa[J[(J[a >> 2] + 24) >> 2]](a) | 0;
          f = Pb(b);
          g = oa[J[(b + 12) >> 2]](b) | 0;
          if (!(H[b | 0] & 1)) {
            c = J[(b + 56) >> 2];
            d = J[(b + 52) >> 2];
            if (d) {
              J[(d + 56) >> 2] = c;
            }
            if (c) {
              J[(c + 52) >> 2] = d;
            }
            if ((b | 0) == J[4298]) {
              J[4298] = c;
            }
            Aa(J[(b + 96) >> 2]);
            Aa(b);
          }
          J[(a + 64) >> 2] = 0;
          oa[J[(J[a >> 2] + 12) >> 2]](a, 0, 0) | 0;
          return f | g | e ? 0 : a;
        }
        function dd(a) {
          var b = 0;
          b = 1;
          a: {
            if ((a | 0) >= 1024) {
              b = 898846567431158e293;
              if (a >>> 0 < 2047) {
                a = (a - 1023) | 0;
                break a;
              }
              b = Infinity;
              a = ((a >>> 0 >= 3069 ? 3069 : a) - 2046) | 0;
              break a;
            }
            if ((a | 0) > -1023) {
              break a;
            }
            b = 2004168360008973e-307;
            if (a >>> 0 > 4294965304) {
              a = (a + 969) | 0;
              break a;
            }
            b = 0;
            a = ((a >>> 0 <= 4294964336 ? -2960 : a) + 1938) | 0;
          }
          u(0, 0);
          u(1, (a + 1023) << 20);
          return b * +w();
        }
        function Za(a, b) {
          var c = 0,
            d = 0,
            e = 0,
            f = 0;
          d = (ka - 16) | 0;
          ka = d;
          a: {
            if (!b) {
              b = 0;
              break a;
            }
            c = b >> 31;
            e = ((c ^ b) - c) | 0;
            c = S(e);
            Ta(d, e, 0, 0, 0, (c + 81) | 0);
            e = (0 + J[(d + 8) >> 2]) | 0;
            c = ((J[(d + 12) >> 2] ^ 65536) + ((16414 - c) << 16)) | 0;
            c = e >>> 0 < f >>> 0 ? (c + 1) | 0 : c;
            b = (b | 0) < 0;
            e = 0 | e;
            f = (b ? -2147483648 : 0) | c;
            c = J[(d + 4) >> 2];
            b = J[d >> 2];
          }
          J[a >> 2] = b;
          J[(a + 4) >> 2] = c;
          J[(a + 8) >> 2] = e;
          J[(a + 12) >> 2] = f;
          ka = (d + 16) | 0;
        }
        function Sb(a) {
          var b = 0,
            c = 0,
            d = 0;
          a: {
            b: {
              b = a;
              if (!(b & 3)) {
                break b;
              }
              if (!K[b | 0]) {
                return 0;
              }
              while (1) {
                b = (b + 1) | 0;
                if (!(b & 3)) {
                  break b;
                }
                if (K[b | 0]) {
                  continue;
                }
                break;
              }
              break a;
            }
            while (1) {
              c = b;
              b = (b + 4) | 0;
              d = J[c >> 2];
              if (((d | (16843008 - d)) & -2139062144) == -2139062144) {
                continue;
              }
              break;
            }
            while (1) {
              b = c;
              c = (b + 1) | 0;
              if (K[b | 0]) {
                continue;
              }
              break;
            }
          }
          return (b - a) | 0;
        }
        function zh(a, b, c, d, e) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          var f = 0,
            g = 0;
          g = (ka - 16) | 0;
          ka = g;
          J[e >> 2] = c;
          f = (g + 12) | 0;
          a = Rc(f, 0, J[(a + 8) >> 2]);
          b = 2;
          a: {
            if ((a + 1) >>> 0 < 2) {
              break a;
            }
            c = (a - 1) | 0;
            b = 1;
            if (c >>> 0 > (d - J[e >> 2]) >>> 0) {
              break a;
            }
            while (1) {
              if (c) {
                a = K[f | 0];
                b = J[e >> 2];
                J[e >> 2] = b + 1;
                H[b | 0] = a;
                c = (c - 1) | 0;
                f = (f + 1) | 0;
                continue;
              }
              break;
            }
            b = 0;
          }
          ka = (g + 16) | 0;
          return b | 0;
        }
        function mi(a, b, c, d, e, f) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          f = f | 0;
          var g = 0,
            h = 0;
          g = (ka - 32) | 0;
          ka = g;
          h = J[1939];
          J[(g + 24) >> 2] = J[1938];
          J[(g + 28) >> 2] = h;
          h = J[1937];
          J[(g + 16) >> 2] = J[1936];
          J[(g + 20) >> 2] = h;
          h = J[1935];
          J[(g + 8) >> 2] = J[1934];
          J[(g + 12) >> 2] = h;
          h = J[1933];
          J[g >> 2] = J[1932];
          J[(g + 4) >> 2] = h;
          h = a;
          a = (g + 32) | 0;
          b = rb(h, b, c, d, e, f, g, a);
          ka = a;
          return b | 0;
        }
        function dc(a) {
          var b = 0;
          b = J[(a + 76) >> 2];
          a: {
            if (!(((b | 0) >= 0) & (!b | (J[4826] != (b & 1073741823))))) {
              b = J[(a + 4) >> 2];
              if ((b | 0) != J[(a + 8) >> 2]) {
                J[(a + 4) >> 2] = b + 1;
                b = K[b | 0];
                break a;
              }
              b = yc(a);
              break a;
            }
            b = J[(a + 76) >> 2];
            J[(a + 76) >> 2] = b ? b : 1073741823;
            b = J[(a + 4) >> 2];
            b: {
              if ((b | 0) != J[(a + 8) >> 2]) {
                J[(a + 4) >> 2] = b + 1;
                b = K[b | 0];
                break b;
              }
              b = yc(a);
            }
            J[(a + 76) >> 2] = 0;
          }
          return b;
        }
        function jd(a, b) {
          var c = 0,
            d = 0,
            e = 0,
            f = 0,
            g = 0;
          J[(a + 136) >> 2] = 0;
          J[(a + 140) >> 2] = 0;
          d = (ka - 16) | 0;
          ka = d;
          c = rd((a + 88) | 0);
          J[(c + 32) >> 2] = b;
          J[c >> 2] = 5880;
          e = Db((d + 12) | 0, (c + 4) | 0);
          b = ec(e);
          fb(e);
          J[(c + 40) >> 2] = a + 136;
          J[(c + 36) >> 2] = b;
          ((f = c),
            (g = oa[J[(J[b >> 2] + 28) >> 2]](b) | 0),
            (H[(f + 44) | 0] = g));
          ka = (d + 16) | 0;
          J[(a + 32) >> 2] = 0;
          J[(a + 4) >> 2] = 4440;
          J[a >> 2] = 4420;
          ac((J[1102] + a) | 0, c);
        }
        function id(a, b) {
          var c = 0,
            d = 0,
            e = 0,
            f = 0,
            g = 0;
          J[(a + 136) >> 2] = 0;
          J[(a + 140) >> 2] = 0;
          d = (ka - 16) | 0;
          ka = d;
          c = Ef((a + 88) | 0);
          J[(c + 32) >> 2] = b;
          J[c >> 2] = 6084;
          e = Db((d + 12) | 0, (c + 4) | 0);
          b = hd(e);
          fb(e);
          J[(c + 40) >> 2] = a + 136;
          J[(c + 36) >> 2] = b;
          ((f = c),
            (g = oa[J[(J[b >> 2] + 28) >> 2]](b) | 0),
            (H[(f + 44) | 0] = g));
          ka = (d + 16) | 0;
          J[(a + 32) >> 2] = 0;
          J[(a + 4) >> 2] = 4584;
          J[a >> 2] = 4564;
          ac((J[1138] + a) | 0, c);
        }
        function ad(a, b, c, d) {
          var e = 0,
            f = 0,
            g = 0,
            h = 0;
          e = (ka - 160) | 0;
          ka = e;
          J[(e + 60) >> 2] = b;
          J[(e + 20) >> 2] = b;
          J[(e + 24) >> 2] = -1;
          f = (e + 16) | 0;
          hb(f, 0, 0);
          af(e, f, d, 1);
          d = J[(e + 8) >> 2];
          g = J[(e + 12) >> 2];
          f = J[e >> 2];
          h = J[(e + 4) >> 2];
          if (c) {
            J[c >> 2] =
              J[(e + 136) >> 2] +
              ((((J[(e + 20) >> 2] - J[(e + 60) >> 2]) | 0) + b) | 0);
          }
          J[(a + 8) >> 2] = d;
          J[(a + 12) >> 2] = g;
          J[a >> 2] = f;
          J[(a + 4) >> 2] = h;
          ka = (e + 160) | 0;
        }
        function gj(a, b, c, d, e) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          var f = 0,
            g = 0,
            h = 0;
          h = (((e - d) | 0) + b) | 0;
          a: {
            while (1) {
              if ((d | 0) != (e | 0)) {
                a = -1;
                if ((b | 0) == (c | 0)) {
                  break a;
                }
                f = H[b | 0];
                g = H[d | 0];
                if ((f | 0) < (g | 0)) {
                  break a;
                }
                if ((f | 0) > (g | 0)) {
                  return 1;
                } else {
                  d = (d + 1) | 0;
                  b = (b + 1) | 0;
                  continue;
                }
              }
              break;
            }
            a = (c | 0) != (h | 0);
          }
          return a | 0;
        }
        function Dg(a, b, c, d) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          var e = 0,
            f = 0;
          if (J[(a + 4) >> 2] == J[(J[(b + 8) >> 2] + 4) >> 2]) {
            Lc(b, c, d);
            return;
          }
          e = J[(a + 12) >> 2];
          f = (a + 16) | 0;
          Rd(f, b, c, d);
          a: {
            if (e >>> 0 < 2) {
              break a;
            }
            e = ((e << 3) + f) | 0;
            a = (a + 24) | 0;
            while (1) {
              Rd(a, b, c, d);
              if (K[(b + 54) | 0]) {
                break a;
              }
              a = (a + 8) | 0;
              if (e >>> 0 > a >>> 0) {
                continue;
              }
              break;
            }
          }
        }
        function Nb(a, b) {
          var c = 0,
            d = 0,
            e = 0,
            f = 0;
          c = (ka - 16) | 0;
          ka = c;
          a: {
            if (!b) {
              b = 0;
              break a;
            }
            d = b;
            b = S(b);
            Ta(c, d, 0, 0, 0, (112 - (b ^ 31)) | 0);
            d = (0 + J[(c + 8) >> 2]) | 0;
            b = ((J[(c + 12) >> 2] ^ 65536) + ((16414 - b) << 16)) | 0;
            f = e >>> 0 > d >>> 0 ? (b + 1) | 0 : b;
            e = J[(c + 4) >> 2];
            b = J[c >> 2];
          }
          J[a >> 2] = b;
          J[(a + 4) >> 2] = e;
          J[(a + 8) >> 2] = d;
          J[(a + 12) >> 2] = f;
          ka = (c + 16) | 0;
        }
        function Xc(a, b, c, d, e) {
          var f = 0,
            g = 0,
            h = 0,
            i = 0;
          f = (ka - 16) | 0;
          ka = f;
          g = (f + 12) | 0;
          Ha(g, b);
          b = ib(g);
          oa[J[(J[b >> 2] + 48) >> 2]](b, 7520, 7548, c) | 0;
          b = Yb(g);
          ((h = d), (i = oa[J[(J[b >> 2] + 12) >> 2]](b) | 0), (J[h >> 2] = i));
          ((h = e), (i = oa[J[(J[b >> 2] + 16) >> 2]](b) | 0), (J[h >> 2] = i));
          oa[J[(J[b >> 2] + 20) >> 2]](a, b);
          Ka(J[(f + 12) >> 2]);
          ka = (f + 16) | 0;
        }
        function cj(a, b, c, d) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          var e = 0,
            f = 0;
          a: {
            e = (d - c) >> 2;
            if (e >>> 0 < 1073741815) {
              b: {
                if (e >>> 0 <= 1) {
                  H[(a + 11) | 0] = e;
                  break b;
                }
                f = e | 1;
                b = Jb((f + 1) | 0);
                J[(a + 8) >> 2] = f - 2147483647;
                J[a >> 2] = b;
                J[(a + 4) >> 2] = e;
                a = b;
              }
              b = (d - c) | 0;
              if (!(!b | ((c | 0) == (d | 0)))) {
                z(a, c, b);
              }
              J[(a + b) >> 2] = 0;
              break a;
            }
            Oa();
            y();
          }
        }
        function fj(a, b, c, d) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          var e = 0,
            f = 0;
          a: {
            e = (d - c) | 0;
            if (e >>> 0 < 2147483639) {
              b: {
                if (e >>> 0 <= 10) {
                  H[(a + 11) | 0] = e;
                  break b;
                }
                f = e | 7;
                b = za((f + 1) | 0);
                J[(a + 8) >> 2] = f - 2147483647;
                J[a >> 2] = b;
                J[(a + 4) >> 2] = e;
                a = b;
              }
              b = (d - c) | 0;
              if (!(!b | ((c | 0) == (d | 0)))) {
                z(a, c, b);
              }
              H[(a + b) | 0] = 0;
              break a;
            }
            Oa();
            y();
          }
        }
        function _c(a, b, c, d, e) {
          var f = 0,
            g = 0,
            h = 0,
            i = 0;
          f = (ka - 16) | 0;
          ka = f;
          g = (f + 12) | 0;
          Ha(g, b);
          b = eb(g);
          oa[J[(J[b >> 2] + 32) >> 2]](b, 7520, 7548, c) | 0;
          b = $b(g);
          ((h = d), (i = oa[J[(J[b >> 2] + 12) >> 2]](b) | 0), (H[h | 0] = i));
          ((h = e), (i = oa[J[(J[b >> 2] + 16) >> 2]](b) | 0), (H[h | 0] = i));
          oa[J[(J[b >> 2] + 20) >> 2]](a, b);
          Ka(J[(f + 12) >> 2]);
          ka = (f + 16) | 0;
        }
        function Hb(a, b) {
          var c = 0,
            d = 0,
            e = 0;
          d = -1;
          a: {
            if ((a | 0) == -1) {
              break a;
            }
            e = J[(b + 76) >> 2] < 0;
            b: {
              c = J[(b + 4) >> 2];
              c: {
                if (!c) {
                  hc(b);
                  c = J[(b + 4) >> 2];
                  if (!c) {
                    break c;
                  }
                }
                if ((J[(b + 44) >> 2] - 8) >>> 0 < c >>> 0) {
                  break b;
                }
              }
              if (e) {
                break a;
              }
              return -1;
            }
            c = (c - 1) | 0;
            J[(b + 4) >> 2] = c;
            H[c | 0] = a;
            J[b >> 2] = J[b >> 2] & -17;
            d = a & 255;
          }
          return d;
        }
        function Eb(a, b) {
          var c = 0,
            d = 0,
            e = 0,
            f = 0;
          d = a;
          a: {
            c = Sb(b);
            if (c >>> 0 < 2147483639) {
              b: {
                c: {
                  if (c >>> 0 >= 11) {
                    e = c | 7;
                    f = za((e + 1) | 0);
                    J[(d + 8) >> 2] = e - 2147483647;
                    J[d >> 2] = f;
                    J[(d + 4) >> 2] = c;
                    d = f;
                    break c;
                  }
                  H[(d + 11) | 0] = c;
                  if (!c) {
                    break b;
                  }
                }
                if (!c) {
                  break b;
                }
                z(d, b, c);
              }
              H[(c + d) | 0] = 0;
              break a;
            }
            Oa();
            y();
          }
          return a;
        }
        function dj(a, b, c, d, e) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          var f = 0,
            g = 0;
          a: {
            while (1) {
              if ((d | 0) != (e | 0)) {
                a = -1;
                if ((b | 0) == (c | 0)) {
                  break a;
                }
                f = J[b >> 2];
                g = J[d >> 2];
                if ((f | 0) < (g | 0)) {
                  break a;
                }
                if ((f | 0) > (g | 0)) {
                  return 1;
                } else {
                  d = (d + 4) | 0;
                  b = (b + 4) | 0;
                  continue;
                }
              }
              break;
            }
            a = (b | 0) != (c | 0);
          }
          return a | 0;
        }
        function hc(a) {
          var b = 0,
            c = 0;
          b = J[(a + 72) >> 2];
          J[(a + 72) >> 2] = (b - 1) | b;
          if (J[(a + 20) >> 2] != J[(a + 28) >> 2]) {
            oa[J[(a + 36) >> 2]](a, 0, 0) | 0;
          }
          J[(a + 28) >> 2] = 0;
          J[(a + 16) >> 2] = 0;
          J[(a + 20) >> 2] = 0;
          b = J[a >> 2];
          if (b & 4) {
            J[a >> 2] = b | 32;
            return -1;
          }
          c = (J[(a + 44) >> 2] + J[(a + 48) >> 2]) | 0;
          J[(a + 8) >> 2] = c;
          J[(a + 4) >> 2] = c;
          return (b << 27) >> 31;
        }
        function Lc(a, b, c) {
          var d = 0;
          d = J[(a + 36) >> 2];
          if (!d) {
            J[(a + 24) >> 2] = c;
            J[(a + 16) >> 2] = b;
            J[(a + 36) >> 2] = 1;
            J[(a + 20) >> 2] = J[(a + 56) >> 2];
            return;
          }
          a: {
            if (
              !(
                (J[(a + 20) >> 2] != J[(a + 56) >> 2]) |
                (J[(a + 16) >> 2] != (b | 0))
              )
            ) {
              if (J[(a + 24) >> 2] != 2) {
                break a;
              }
              J[(a + 24) >> 2] = c;
              return;
            }
            H[(a + 54) | 0] = 1;
            J[(a + 24) >> 2] = 2;
            J[(a + 36) >> 2] = d + 1;
          }
        }
        function Kb(a, b) {
          var c = 0,
            d = 0,
            e = 0;
          a: {
            c = Xe(b);
            if (c >>> 0 < 1073741815) {
              b: {
                c: {
                  if (c >>> 0 >= 2) {
                    e = c | 1;
                    d = Jb((e + 1) | 0);
                    J[(a + 8) >> 2] = e - 2147483647;
                    J[a >> 2] = d;
                    J[(a + 4) >> 2] = c;
                    a = d;
                    break c;
                  }
                  H[(a + 11) | 0] = c;
                  if (!c) {
                    break b;
                  }
                }
                d = c << 2;
                if (!d) {
                  break b;
                }
                z(a, b, d);
              }
              J[((c << 2) + a) >> 2] = 0;
              break a;
            }
            Oa();
            y();
          }
        }
        function Sd(a, b, c) {
          var d = 0,
            e = 0;
          if (b >>> 0 < 1073741815) {
            a: {
              if (b >>> 0 <= 1) {
                H[(a + 11) | 0] = b;
                break a;
              }
              d = b | 1;
              e = Jb((d + 1) | 0);
              J[(a + 8) >> 2] = d - 2147483647;
              J[a >> 2] = e;
              J[(a + 4) >> 2] = b;
              a = e;
            }
            e = b;
            d = a;
            while (1) {
              if (e) {
                J[d >> 2] = c;
                e = (e - 1) | 0;
                d = (d + 4) | 0;
                continue;
              }
              break;
            }
            J[((b << 2) + a) >> 2] = 0;
            return;
          }
          Oa();
          y();
        }
        function Lj(a, b) {
          a = a | 0;
          b = b | 0;
          var c = 0,
            d = 0;
          d = -1;
          a: {
            if (!J[(a + 64) >> 2]) {
              break a;
            }
            c = J[(a + 12) >> 2];
            if (c >>> 0 <= M[(a + 8) >> 2]) {
              break a;
            }
            if ((b | 0) == -1) {
              J[(a + 12) >> 2] = c - 1;
              return 0;
            }
            c = (c - 1) | 0;
            if (!(K[(a + 88) | 0] & 16) & (K[c | 0] != (b & 255))) {
              break a;
            }
            d = a;
            a = c;
            J[(d + 12) >> 2] = a;
            H[a | 0] = b;
            d = b;
          }
          return d | 0;
        }
        function Ic(a, b) {
          var c = 0,
            d = 0,
            e = 0;
          d = Bd(a);
          e = na;
          c = P(b, 7);
          b = c & 31;
          if ((c & 63) >>> 0 >= 32) {
            c = 63 << b;
            b = 0;
          } else {
            c = ((1 << b) - 1) & (63 >>> (32 - b));
            b = 63 << b;
          }
          b = b & d;
          c = c & e;
          d = J[(a + 8) >> 2];
          a = (J[(a + 12) >> 2] + 1032) | 0;
          d = (d + 270549121) | 0;
          a = d >>> 0 < 270549121 ? (a + 1) | 0 : a;
          return ((b & d & -135274561) | (a & c & 65019)) != 0;
        }
        function ub(a) {
          a = a | 0;
          var b = 0,
            c = 0;
          J[a >> 2] = 5400;
          if (J[(a + 28) >> 2]) {
            b = J[(a + 40) >> 2];
            while (1) {
              if (b) {
                b = (b - 1) | 0;
                c = b << 2;
                oa[J[(J[(a + 32) >> 2] + c) >> 2]](
                  0,
                  a,
                  J[(c + J[(a + 36) >> 2]) >> 2],
                );
                continue;
              }
              break;
            }
            fb((a + 28) | 0);
            Aa(J[(a + 32) >> 2]);
            Aa(J[(a + 36) >> 2]);
            Aa(J[(a + 48) >> 2]);
            Aa(J[(a + 60) >> 2]);
          }
          return a | 0;
        }
        function Td(a, b, c) {
          var d = 0,
            e = 0;
          if (b >>> 0 < 2147483639) {
            a: {
              if (b >>> 0 <= 10) {
                H[(a + 11) | 0] = b;
                break a;
              }
              d = b | 7;
              e = za((d + 1) | 0);
              J[(a + 8) >> 2] = d - 2147483647;
              J[a >> 2] = e;
              J[(a + 4) >> 2] = b;
              a = e;
            }
            e = b;
            d = a;
            while (1) {
              if (e) {
                H[d | 0] = c;
                e = (e - 1) | 0;
                d = (d + 1) | 0;
                continue;
              }
              break;
            }
            H[(a + b) | 0] = 0;
            return;
          }
          Oa();
          y();
        }
        function cc(a, b) {
          var c = 0,
            d = 0,
            e = 0,
            f = 0;
          c = Sb(b);
          e = (ka - 16) | 0;
          ka = e;
          f = Cc((e + 8) | 0, a);
          a: {
            if (K[f | 0] != 1) {
              break a;
            }
            d = (J[(J[a >> 2] - 12) >> 2] + a) | 0;
            c = (b + c) | 0;
            if (
              jc(
                J[(d + 24) >> 2],
                b,
                (J[(d + 4) >> 2] & 176) == 32 ? c : b,
                c,
                d,
                zd(d),
              )
            ) {
              break a;
            }
            ob((J[(J[a >> 2] - 12) >> 2] + a) | 0, 5);
          }
          fc(f);
          ka = (e + 16) | 0;
          return a;
        }
        function gc(a) {
          var b = 0,
            c = 0;
          b = (ka - 16) | 0;
          ka = b;
          if (J[(((J[(J[a >> 2] - 12) >> 2] + a) | 0) + 24) >> 2]) {
            Cc((b + 8) | 0, a);
            a: {
              if (K[(b + 8) | 0] != 1) {
                break a;
              }
              c = J[(((J[(J[a >> 2] - 12) >> 2] + a) | 0) + 24) >> 2];
              if ((oa[J[(J[c >> 2] + 24) >> 2]](c) | 0) != -1) {
                break a;
              }
              ob((J[(J[a >> 2] - 12) >> 2] + a) | 0, 1);
            }
            fc((b + 8) | 0);
          }
          ka = (b + 16) | 0;
        }
        function fc(a) {
          var b = 0;
          a: {
            b = J[(a + 4) >> 2];
            b = (J[(J[b >> 2] - 12) >> 2] + b) | 0;
            if (!J[(b + 24) >> 2] | J[(b + 16) >> 2] | !(K[(b + 5) | 0] & 32)) {
              break a;
            }
            b = J[(a + 4) >> 2];
            b = J[(((J[(J[b >> 2] - 12) >> 2] + b) | 0) + 24) >> 2];
            if ((oa[J[(J[b >> 2] + 24) >> 2]](b) | 0) != -1) {
              break a;
            }
            a = J[(a + 4) >> 2];
            ob((J[(J[a >> 2] - 12) >> 2] + a) | 0, 1);
          }
        }
        function wc(a) {
          var b = 0,
            c = 0;
          c = jf((J[(J[a >> 2] - 12) >> 2] + a) | 0, 10);
          b = (ka - 16) | 0;
          ka = b;
          Cc((b + 8) | 0, a);
          a: {
            if (K[(b + 8) | 0] != 1) {
              break a;
            }
            J[(b + 4) >> 2] =
              J[(((J[(J[a >> 2] - 12) >> 2] + a) | 0) + 24) >> 2];
            Ff((b + 4) | 0, c);
            if (J[(b + 4) >> 2]) {
              break a;
            }
            ob((J[(J[a >> 2] - 12) >> 2] + a) | 0, 1);
          }
          fc((b + 8) | 0);
          ka = (b + 16) | 0;
          gc(a);
        }
        function hb(a, b, c) {
          var d = 0,
            e = 0,
            f = 0,
            g = 0;
          J[(a + 112) >> 2] = b;
          J[(a + 116) >> 2] = c;
          f = J[(a + 4) >> 2];
          e = (J[(a + 44) >> 2] - f) | 0;
          J[(a + 120) >> 2] = e;
          J[(a + 124) >> 2] = e >> 31;
          e = a;
          a = J[(a + 8) >> 2];
          d = (a - f) | 0;
          g = b >>> 0 >= d >>> 0;
          d = d >> 31;
          if (
            !(!(b | c) | ((g & ((d | 0) <= (c | 0))) | ((c | 0) > (d | 0))))
          ) {
            a = (b + f) | 0;
          }
          J[(e + 104) >> 2] = a;
        }
        function oc(a, b, c) {
          c = J[(c + 4) >> 2] & 176;
          if ((c | 0) == 32) {
            return b;
          }
          a: {
            if ((c | 0) != 16) {
              break a;
            }
            b: {
              c: {
                c = K[a | 0];
                switch ((c - 43) | 0) {
                  case 0:
                  case 2:
                    break c;
                  default:
                    break b;
                }
              }
              return (a + 1) | 0;
            }
            if (
              ((c | 0) != 48) |
              (((b - a) | 0) < 2) |
              ((K[(a + 1) | 0] | 32) != 120)
            ) {
              break a;
            }
            a = (a + 2) | 0;
          }
          return a;
        }
        function oj(a, b, c) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          var d = 0;
          a: {
            if (!K[(a + 44) | 0]) {
              c = (c | 0) > 0 ? c : 0;
              while (1) {
                if ((c | 0) == (d | 0)) {
                  break a;
                }
                if ((oa[J[(J[a >> 2] + 52) >> 2]](a, J[b >> 2]) | 0) == -1) {
                  return d | 0;
                } else {
                  b = (b + 4) | 0;
                  d = (d + 1) | 0;
                  continue;
                }
              }
            }
            c = ab(b, 4, c, J[(a + 32) >> 2]);
          }
          return c | 0;
        }
        function vj(a, b, c) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          var d = 0;
          a: {
            if (!K[(a + 44) | 0]) {
              c = (c | 0) > 0 ? c : 0;
              while (1) {
                if ((c | 0) == (d | 0)) {
                  break a;
                }
                if ((oa[J[(J[a >> 2] + 52) >> 2]](a, K[b | 0]) | 0) == -1) {
                  return d | 0;
                } else {
                  b = (b + 1) | 0;
                  d = (d + 1) | 0;
                  continue;
                }
              }
            }
            c = ab(b, 1, c, J[(a + 32) >> 2]);
          }
          return c | 0;
        }
        function Rd(a, b, c, d) {
          var e = 0,
            f = 0,
            g = 0;
          f = J[(a + 4) >> 2];
          g = f & 1;
          a: {
            if (K[(b + 55) | 0] == 1) {
              e = f >> 8;
              if (!g) {
                break a;
              }
              e = J[(e + J[c >> 2]) >> 2];
              break a;
            }
            e = f >> 8;
            if (!g) {
              break a;
            }
            J[(b + 56) >> 2] = J[(J[a >> 2] + 4) >> 2];
            c = 0;
            e = 0;
          }
          a = J[a >> 2];
          oa[J[(J[a >> 2] + 28) >> 2]](a, b, (c + e) | 0, f & 2 ? d : 2);
        }
        function Ga(a) {
          var b = 0,
            c = 0;
          b = (ka - 16) | 0;
          ka = b;
          J[(b + 4) >> 2] = a;
          if (J[a >> 2] != -1) {
            J[(b + 12) >> 2] = b + 4;
            J[(b + 8) >> 2] = b + 12;
            c = (b + 8) | 0;
            while (1) {
              if (J[a >> 2] == 1) {
                continue;
              }
              break;
            }
            if (!J[a >> 2]) {
              J[a >> 2] = 1;
              le(c);
              J[a >> 2] = -1;
            }
          }
          ka = (b + 16) | 0;
          return (J[(a + 4) >> 2] - 1) | 0;
        }
        function dk(a, b, c, d) {
          var e = 0,
            f = 0,
            g = 0,
            h = 0,
            i = 0,
            j = 0;
          e = (c >>> 16) | 0;
          f = (a >>> 16) | 0;
          j = P(e, f);
          g = c & 65535;
          h = a & 65535;
          i = P(g, h);
          f = (((i >>> 16) | 0) + P(f, g)) | 0;
          e = ((f & 65535) + P(e, h)) | 0;
          na = (((P(b, c) + j) | 0) + P(a, d) + (f >>> 16) + (e >>> 16)) | 0;
          return (i & 65535) | (e << 16);
        }
        function Ff(a, b) {
          var c = 0,
            d = 0;
          a: {
            c = J[a >> 2];
            if (!c) {
              break a;
            }
            d = J[(c + 24) >> 2];
            b: {
              if ((d | 0) == J[(c + 28) >> 2]) {
                b = oa[J[(J[c >> 2] + 52) >> 2]](c, b & 255) | 0;
                break b;
              }
              H[d | 0] = b;
              J[(c + 24) >> 2] = J[(c + 24) >> 2] + 1;
              b = b & 255;
            }
            if ((b | 0) != -1) {
              break a;
            }
            J[a >> 2] = 0;
          }
        }
        function li(a, b, c, d, e, f) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          f = f | 0;
          var g = 0,
            h = 0,
            i = 0,
            j = 0;
          g = oa[J[(J[(a + 8) >> 2] + 20) >> 2]]((a + 8) | 0) | 0;
          h = H[(g + 11) | 0];
          i = (h | 0) < 0;
          j = a;
          a = i ? J[g >> 2] : g;
          return (
            rb(
              j,
              b,
              c,
              d,
              e,
              f,
              a,
              (a + ((i ? J[(g + 4) >> 2] : h) << 2)) | 0,
            ) | 0
          );
        }
        function si(a, b, c, d, e, f) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          f = f | 0;
          var g = 0,
            h = 0,
            i = 0,
            j = 0;
          g = oa[J[(J[(a + 8) >> 2] + 20) >> 2]]((a + 8) | 0) | 0;
          h = H[(g + 11) | 0];
          i = (h | 0) < 0;
          j = a;
          a = i ? J[g >> 2] : g;
          return (
            sb(j, b, c, d, e, f, a, (a + (i ? J[(g + 4) >> 2] : h)) | 0) | 0
          );
        }
        function Rb(a) {
          var b = 0,
            c = 0,
            d = 0;
          c = J[4020];
          a = (a + 7) | 0;
          b = a >>> 0 < 7 ? 1 : b;
          d = a & -8;
          a = (d + c) | 0;
          a: {
            if (!(a >>> 0 < d >>> 0 ? (b + 1) | 0 : b)) {
              if (a >>> 0 <= (pa() << 16) >>> 0) {
                break a;
              }
              if (ja(a | 0) | 0) {
                break a;
              }
            }
            J[4158] = 48;
            return -1;
          }
          J[4020] = a;
          return c;
        }
        function tj(a, b) {
          a = a | 0;
          b = b | 0;
          var c = 0,
            d = 0;
          b = hd(b);
          J[(a + 36) >> 2] = b;
          ((c = a),
            (d = oa[J[(J[b >> 2] + 24) >> 2]](b) | 0),
            (J[(c + 44) >> 2] = d));
          b = J[(a + 36) >> 2];
          ((c = a),
            (d = oa[J[(J[b >> 2] + 28) >> 2]](b) | 0),
            (H[(c + 53) | 0] = d));
          if (J[(a + 44) >> 2] >= 9) {
            Oa();
            y();
          }
        }
        function Aj(a, b) {
          a = a | 0;
          b = b | 0;
          var c = 0,
            d = 0;
          b = ec(b);
          J[(a + 36) >> 2] = b;
          ((c = a),
            (d = oa[J[(J[b >> 2] + 24) >> 2]](b) | 0),
            (J[(c + 44) >> 2] = d));
          b = J[(a + 36) >> 2];
          ((c = a),
            (d = oa[J[(J[b >> 2] + 28) >> 2]](b) | 0),
            (H[(c + 53) | 0] = d));
          if (J[(a + 44) >> 2] >= 9) {
            Oa();
            y();
          }
        }
        function ri(a, b, c, d, e, f) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          f = f | 0;
          var g = 0;
          g = (ka - 16) | 0;
          ka = g;
          J[(g + 12) >> 2] = b;
          b = (g + 8) | 0;
          Ha(b, d);
          b = eb(b);
          Ka(J[(g + 8) >> 2]);
          Be(a, (f + 24) | 0, (g + 12) | 0, c, e, b);
          ka = (g + 16) | 0;
          return J[(g + 12) >> 2];
        }
        function qi(a, b, c, d, e, f) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          f = f | 0;
          var g = 0;
          g = (ka - 16) | 0;
          ka = g;
          J[(g + 12) >> 2] = b;
          b = (g + 8) | 0;
          Ha(b, d);
          b = eb(b);
          Ka(J[(g + 8) >> 2]);
          Ae(a, (f + 16) | 0, (g + 12) | 0, c, e, b);
          ka = (g + 16) | 0;
          return J[(g + 12) >> 2];
        }
        function ki(a, b, c, d, e, f) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          f = f | 0;
          var g = 0;
          g = (ka - 16) | 0;
          ka = g;
          J[(g + 12) >> 2] = b;
          b = (g + 8) | 0;
          Ha(b, d);
          b = ib(b);
          Ka(J[(g + 8) >> 2]);
          ye(a, (f + 24) | 0, (g + 12) | 0, c, e, b);
          ka = (g + 16) | 0;
          return J[(g + 12) >> 2];
        }
        function ji(a, b, c, d, e, f) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          f = f | 0;
          var g = 0;
          g = (ka - 16) | 0;
          ka = g;
          J[(g + 12) >> 2] = b;
          b = (g + 8) | 0;
          Ha(b, d);
          b = ib(b);
          Ka(J[(g + 8) >> 2]);
          xe(a, (f + 16) | 0, (g + 12) | 0, c, e, b);
          ka = (g + 16) | 0;
          return J[(g + 12) >> 2];
        }
        function Ze(a, b, c, d) {
          a: {
            if (!a) {
              break a;
            }
            b: {
              switch ((b + 2) | 0) {
                case 0:
                  H[a | 0] = c;
                  return;
                case 1:
                  I[a >> 1] = c;
                  return;
                case 2:
                case 3:
                  J[a >> 2] = c;
                  return;
                case 5:
                  break b;
                default:
                  break a;
              }
            }
            J[a >> 2] = c;
            J[(a + 4) >> 2] = d;
          }
        }
        function Qf(a) {
          var b = 0;
          b = J[(a + 72) >> 2];
          J[(a + 72) >> 2] = (b - 1) | b;
          b = J[a >> 2];
          if (b & 8) {
            J[a >> 2] = b | 32;
            return -1;
          }
          J[(a + 4) >> 2] = 0;
          J[(a + 8) >> 2] = 0;
          b = J[(a + 44) >> 2];
          J[(a + 28) >> 2] = b;
          J[(a + 20) >> 2] = b;
          J[(a + 16) >> 2] = b + J[(a + 48) >> 2];
          return 0;
        }
        function cd(a, b, c, d, e, f, g, h, i) {
          var j = 0;
          j = (ka - 16) | 0;
          ka = j;
          Ya(j, b, c, d, e, f, g, h, i ^ -2147483648);
          d = J[j >> 2];
          c = J[(j + 4) >> 2];
          b = J[(j + 12) >> 2];
          J[(a + 8) >> 2] = J[(j + 8) >> 2];
          J[(a + 12) >> 2] = b;
          J[a >> 2] = d;
          J[(a + 4) >> 2] = c;
          ka = (j + 16) | 0;
        }
        function md(a) {
          a = a | 0;
          var b = 0;
          J[a >> 2] = 4600;
          Cf(a);
          a: {
            if (K[(a + 96) | 0] != 1) {
              break a;
            }
            b = J[(a + 32) >> 2];
            if (!b) {
              break a;
            }
            Aa(b);
          }
          b: {
            if (K[(a + 97) | 0] != 1) {
              break b;
            }
            b = J[(a + 56) >> 2];
            if (!b) {
              break b;
            }
            Aa(b);
          }
          return Fc(a) | 0;
        }
        function yh(a) {
          a = a | 0;
          var b = 0,
            c = 0,
            d = 0,
            e = 0;
          b = (ka - 16) | 0;
          ka = b;
          ((d = b), (e = tb(J[(a + 8) >> 2])), (J[(d + 12) >> 2] = e));
          c = xf(0, 0, 4);
          wb((b + 12) | 0);
          ka = (b + 16) | 0;
          if (c) {
            return -1;
          }
          a = J[(a + 8) >> 2];
          if (!a) {
            return 1;
          }
          return ((fe(a) | 0) == 1) | 0;
        }
        function vc(a, b) {
          var c = 0,
            d = 0;
          c = K[a | 0];
          d = K[b | 0];
          a: {
            if (!c | ((d | 0) != (c | 0))) {
              break a;
            }
            while (1) {
              d = K[(b + 1) | 0];
              c = K[(a + 1) | 0];
              if (!c) {
                break a;
              }
              b = (b + 1) | 0;
              a = (a + 1) | 0;
              if ((c | 0) == (d | 0)) {
                continue;
              }
              break;
            }
          }
          return (c - d) | 0;
        }
        function hj(a, b, c) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          var d = 0,
            e = 0,
            f = 0;
          e = J[(a + 84) >> 2];
          d = (c + 256) | 0;
          f = kf(e, 0, d);
          d = f ? (f - e) | 0 : d;
          c = c >>> 0 > d >>> 0 ? d : c;
          vb(b, e, c);
          b = (e + d) | 0;
          J[(a + 84) >> 2] = b;
          J[(a + 8) >> 2] = b;
          J[(a + 4) >> 2] = c + e;
          return c | 0;
        }
        function ti(a, b, c, d, e, f) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          f = f | 0;
          var g = 0,
            h = 0;
          g = (ka - 16) | 0;
          ka = g;
          J[(g + 8) >> 2] = 624576549;
          J[(g + 12) >> 2] = 1394948685;
          h = a;
          a = (g + 16) | 0;
          b = sb(h, b, c, d, e, f, (g + 8) | 0, a);
          ka = a;
          return b | 0;
        }
        function pi(a, b, c, d, e, f) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          f = f | 0;
          a = (ka - 16) | 0;
          ka = a;
          J[(a + 12) >> 2] = b;
          b = (a + 8) | 0;
          Ha(b, d);
          b = eb(b);
          Ka(J[(a + 8) >> 2]);
          ze((f + 20) | 0, (a + 12) | 0, c, e, b);
          ka = (a + 16) | 0;
          return J[(a + 12) >> 2];
        }
        function ii(a, b, c, d, e, f) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          f = f | 0;
          a = (ka - 16) | 0;
          ka = a;
          J[(a + 12) >> 2] = b;
          b = (a + 8) | 0;
          Ha(b, d);
          b = ib(b);
          Ka(J[(a + 8) >> 2]);
          we((f + 20) | 0, (a + 12) | 0, c, e, b);
          ka = (a + 16) | 0;
          return J[(a + 12) >> 2];
        }
        function Wh(a, b, c, d) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          while (1) {
            if ((b | 0) != (c | 0)) {
              a = J[b >> 2];
              if (a >>> 0 <= 127) {
                a = J[((a << 2) + 7840) >> 2];
              } else {
                a = 0;
              }
              J[d >> 2] = a;
              d = (d + 4) | 0;
              b = (b + 4) | 0;
              continue;
            }
            break;
          }
          return b | 0;
        }
        function Ie(a, b, c) {
          var d = 0,
            e = 0;
          d = (ka - 16) | 0;
          ka = d;
          e = J[c >> 2];
          c = (b - a) >> 2;
          a: {
            if (c) {
              while (1) {
                if (J[a >> 2] == (e | 0)) {
                  break a;
                }
                a = (a + 4) | 0;
                c = (c - 1) | 0;
                if (c) {
                  continue;
                }
                break;
              }
            }
            a = 0;
          }
          ka = (d + 16) | 0;
          return a ? a : b;
        }
        function Vb(a, b, c) {
          var d = 0,
            e = 0,
            f = 0,
            g = 0;
          d = (ka - 16) | 0;
          ka = d;
          e = (d + 12) | 0;
          Ha(e, b);
          b = Yb(e);
          ((f = c), (g = oa[J[(J[b >> 2] + 16) >> 2]](b) | 0), (J[f >> 2] = g));
          oa[J[(J[b >> 2] + 20) >> 2]](a, b);
          Ka(J[(d + 12) >> 2]);
          ka = (d + 16) | 0;
        }
        function Zb(a, b, c) {
          var d = 0,
            e = 0,
            f = 0,
            g = 0;
          d = (ka - 16) | 0;
          ka = d;
          e = (d + 12) | 0;
          Ha(e, b);
          b = $b(e);
          ((f = c), (g = oa[J[(J[b >> 2] + 16) >> 2]](b) | 0), (H[f | 0] = g));
          oa[J[(J[b >> 2] + 20) >> 2]](a, b);
          Ka(J[(d + 12) >> 2]);
          ka = (d + 16) | 0;
        }
        function Vh(a, b, c, d) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          while (1) {
            a: {
              if ((c | 0) == (d | 0)) {
                break a;
              }
              a = J[c >> 2];
              if (J[((a << 2) + 7840) >> 2] & b ? a >>> 0 <= 127 : 0) {
                break a;
              }
              c = (c + 4) | 0;
              continue;
            }
            break;
          }
          return c | 0;
        }
        function Uh(a, b, c, d) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          while (1) {
            a: {
              if ((c | 0) == (d | 0)) {
                break a;
              }
              a = J[c >> 2];
              if ((a >>> 0 > 127) | !(J[((a << 2) + 7840) >> 2] & b)) {
                break a;
              }
              c = (c + 4) | 0;
              continue;
            }
            break;
          }
          return c | 0;
        }
        function _j(a, b, c, d) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          var e = 0;
          e = (ka - 16) | 0;
          ka = e;
          a = ic(ha(J[(a + 60) >> 2], b | 0, c | 0, d & 255, (e + 8) | 0) | 0);
          ka = (e + 16) | 0;
          na = a ? -1 : J[(e + 12) >> 2];
          return (a ? -1 : J[(e + 8) >> 2]) | 0;
        }
        function ac(a, b) {
          J[(a + 20) >> 2] = 0;
          J[(a + 24) >> 2] = b;
          J[(a + 12) >> 2] = 0;
          J[(a + 4) >> 2] = 4098;
          J[(a + 8) >> 2] = 6;
          J[(a + 16) >> 2] = !b;
          D((a + 32) | 0, 0, 40);
          me((a + 28) | 0);
          H[(a + 80) | 0] = 0;
          J[(a + 72) >> 2] = 0;
          J[(a + 76) >> 2] = -1;
        }
        function uc(a, b) {
          var c = 0,
            d = 0,
            e = 0,
            f = 0;
          c = 24;
          a: {
            while (1) {
              d = K[a | 0];
              e = K[b | 0];
              if ((d | 0) == (e | 0)) {
                b = (b + 1) | 0;
                a = (a + 1) | 0;
                c = (c - 1) | 0;
                if (c) {
                  continue;
                }
                break a;
              }
              break;
            }
            f = (d - e) | 0;
          }
          return f;
        }
        function Oc(a, b) {
          var c = 0,
            d = 0;
          c = ((b >>> 0) / 100) | 0;
          d = L[((c << 1) + 14416) >> 1];
          H[a | 0] = d;
          H[(a + 1) | 0] = d >>> 8;
          b = L[(((b - P(c, 100)) << 1) + 14416) >> 1];
          H[(a + 2) | 0] = b;
          H[(a + 3) | 0] = b >>> 8;
          return (a + 4) | 0;
        }
        function bj(a, b, c) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          var d = 0;
          a = 0;
          while (1) {
            if ((b | 0) != (c | 0)) {
              a = (J[b >> 2] + (a << 4)) | 0;
              d = a & -268435456;
              a = (d | (d >>> 24)) ^ a;
              b = (b + 4) | 0;
              continue;
            }
            break;
          }
          return a | 0;
        }
        function ej(a, b, c) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          var d = 0;
          a = 0;
          while (1) {
            if ((b | 0) != (c | 0)) {
              a = (H[b | 0] + (a << 4)) | 0;
              d = a & -268435456;
              a = (d | (d >>> 24)) ^ a;
              b = (b + 1) | 0;
              continue;
            }
            break;
          }
          return a | 0;
        }
        function Nh(a, b, c, d, e) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          while (1) {
            if ((b | 0) != (c | 0)) {
              a = J[b >> 2];
              H[e | 0] = a >>> 0 < 128 ? a : d;
              e = (e + 1) | 0;
              b = (b + 4) | 0;
              continue;
            }
            break;
          }
          return b | 0;
        }
        function za(a) {
          var b = 0,
            c = 0;
          c = a >>> 0 <= 1 ? 1 : a;
          while (1) {
            a: {
              a = Wa(c);
              if (a) {
                break a;
              }
              b = J[5679];
              if (!b) {
                break a;
              }
              oa[b | 0]();
              continue;
            }
            break;
          }
          if (!a) {
            Oa();
            y();
          }
          return a;
        }
        function Uc(a, b) {
          var c = 0;
          a: {
            if ((a | 0) == (b | 0)) {
              break a;
            }
            while (1) {
              b = (b - 4) | 0;
              if (b >>> 0 <= a >>> 0) {
                break a;
              }
              c = J[a >> 2];
              J[a >> 2] = J[b >> 2];
              J[b >> 2] = c;
              a = (a + 4) | 0;
              continue;
            }
          }
        }
        function Eh(a, b, c, d, e) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          while (1) {
            if ((b | 0) != (c | 0)) {
              a = H[b | 0];
              H[e | 0] = (a | 0) < 0 ? d : a;
              e = (e + 1) | 0;
              b = (b + 1) | 0;
              continue;
            }
            break;
          }
          return b | 0;
        }
        function xg(a, b, c, d, e, f) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          f = f | 0;
          if (pb(a, J[(b + 8) >> 2], f)) {
            Kc(b, c, d, e);
            return;
          }
          a = J[(a + 8) >> 2];
          oa[J[(J[a >> 2] + 20) >> 2]](a, b, c, d, e, f);
        }
        function nc(a, b) {
          var c = 0;
          a: {
            if ((a | 0) == (b | 0)) {
              break a;
            }
            while (1) {
              b = (b - 1) | 0;
              if (b >>> 0 <= a >>> 0) {
                break a;
              }
              c = K[a | 0];
              H[a | 0] = K[b | 0];
              H[b | 0] = c;
              a = (a + 1) | 0;
              continue;
            }
          }
        }
        function Gc(a) {
          var b = 0,
            c = 0;
          c = Bd(a);
          b = J[(a + 8) >> 2];
          a = (J[(a + 12) >> 2] + 1032) | 0;
          b = (b + 270549121) | 0;
          a = b >>> 0 < 270549121 ? (a + 1) | 0 : a;
          return ((b & c & -135274561) | (a & na & 65019)) != 0;
        }
        function yc(a) {
          var b = 0,
            c = 0;
          b = (ka - 16) | 0;
          ka = b;
          c = -1;
          a: {
            if (hc(a)) {
              break a;
            }
            if ((oa[J[(a + 32) >> 2]](a, (b + 15) | 0, 1) | 0) != 1) {
              break a;
            }
            c = K[(b + 15) | 0];
          }
          ka = (b + 16) | 0;
          return c;
        }
        function ab(a, b, c, d) {
          var e = 0;
          e = P(b, c);
          a: {
            if (J[(d + 76) >> 2] < 0) {
              a = td(a, e, d);
              break a;
            }
            a = td(a, e, d);
          }
          if ((e | 0) == (a | 0)) {
            return b ? c : 0;
          }
          return ((a >>> 0) / (b >>> 0)) | 0;
        }
        function _g(a) {
          a = a | 0;
          if (K[21284]) {
            return J[5320];
          }
          if (!K[22408]) {
            H[22408] = 1;
          }
          Da(22384, 14344);
          Da(22396, 14356);
          H[21284] = 1;
          J[5320] = 22384;
          return 22384;
        }
        function Sh(a, b, c) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          while (1) {
            if ((b | 0) != (c | 0)) {
              a = J[b >> 2];
              J[b >> 2] = (a - 123) >>> 0 < 4294967270 ? a : a & 95;
              b = (b + 4) | 0;
              continue;
            }
            break;
          }
          return b | 0;
        }
        function ah(a) {
          a = a | 0;
          if (K[21276]) {
            return J[5318];
          }
          if (!K[22376]) {
            H[22376] = 1;
          }
          Ea(22352, 1925);
          Ea(22364, 1922);
          H[21276] = 1;
          J[5318] = 22352;
          return 22352;
        }
        function Qh(a, b, c) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          while (1) {
            if ((b | 0) != (c | 0)) {
              a = J[b >> 2];
              J[b >> 2] = (a - 91) >>> 0 < 4294967270 ? a : a | 32;
              b = (b + 4) | 0;
              continue;
            }
            break;
          }
          return b | 0;
        }
        function Wb(a, b) {
          var c = 0,
            d = 0;
          c = (ka - 16) | 0;
          ka = c;
          d = (c + 12) | 0;
          Ha(d, a);
          a = ib(d);
          oa[J[(J[a >> 2] + 48) >> 2]](a, 7520, 7546, b) | 0;
          Ka(J[(c + 12) >> 2]);
          ka = (c + 16) | 0;
          return b;
        }
        function Kh(a, b, c) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          while (1) {
            if ((b | 0) != (c | 0)) {
              a = K[b | 0];
              H[b | 0] = ((a - 123) & 255) >>> 0 < 230 ? a : a & 95;
              b = (b + 1) | 0;
              continue;
            }
            break;
          }
          return b | 0;
        }
        function Ih(a, b, c) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          while (1) {
            if ((b | 0) != (c | 0)) {
              a = K[b | 0];
              H[b | 0] = ((a - 91) & 255) >>> 0 < 230 ? a : a | 32;
              b = (b + 1) | 0;
              continue;
            }
            break;
          }
          return b | 0;
        }
        function Eg(a, b, c, d) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          if (J[(a + 4) >> 2] == J[(J[(b + 8) >> 2] + 4) >> 2]) {
            Lc(b, c, d);
            return;
          }
          a = J[(a + 8) >> 2];
          oa[J[(J[a >> 2] + 28) >> 2]](a, b, c, d);
        }
        function lj(a, b) {
          a = a | 0;
          b = b | 0;
          var c = 0,
            d = 0,
            e = 0;
          c = b;
          b = (J[b >> 2] + 7) & -8;
          J[c >> 2] = b + 16;
          ((d = a),
            (e = fd(
              J[b >> 2],
              J[(b + 4) >> 2],
              J[(b + 8) >> 2],
              J[(b + 12) >> 2],
            )),
            (O[d >> 3] = e));
        }
        function Jc(a, b, c, d, e, f) {
          var g = 0,
            h = 0;
          g = J[(a + 4) >> 2];
          h = g >> 8;
          a = J[a >> 2];
          if (g & 1) {
            h = J[(J[d >> 2] + h) >> 2];
          }
          oa[J[(J[a >> 2] + 20) >> 2]](a, b, c, (d + h) | 0, g & 2 ? e : 2, f);
        }
        function se(a, b) {
          var c = 0;
          if (H[(a + 11) | 0] < 0) {
            Aa(J[a >> 2]);
          }
          J[(a + 8) >> 2] = J[(b + 8) >> 2];
          c = J[(b + 4) >> 2];
          J[a >> 2] = J[b >> 2];
          J[(a + 4) >> 2] = c;
          H[(b + 11) | 0] = 0;
          J[b >> 2] = 0;
        }
        function of(a) {
          var b = 0,
            c = 0;
          J[a >> 2] = 1032;
          b = za(67109036);
          J[(a + 4) >> 2] = b;
          c = za(16777259);
          J[(a + 8) >> 2] = c;
          D(b, 0, 67109036);
          D(c, 0, 16777259);
          return a;
        }
        function Ac(a, b) {
          var c = 0;
          if (H[(a + 11) | 0] < 0) {
            Aa(J[a >> 2]);
          }
          J[(a + 8) >> 2] = J[(b + 8) >> 2];
          c = J[(b + 4) >> 2];
          J[a >> 2] = J[b >> 2];
          J[(a + 4) >> 2] = c;
          H[(b + 11) | 0] = 0;
          H[b | 0] = 0;
        }
        function wj(a, b) {
          a = a | 0;
          b = b | 0;
          var c = 0,
            d = 0;
          oa[J[(J[a >> 2] + 24) >> 2]](a) | 0;
          b = ec(b);
          J[(a + 36) >> 2] = b;
          ((c = a),
            (d = oa[J[(J[b >> 2] + 28) >> 2]](b) | 0),
            (H[(c + 44) | 0] = d));
        }
        function pj(a, b) {
          a = a | 0;
          b = b | 0;
          var c = 0,
            d = 0;
          oa[J[(J[a >> 2] + 24) >> 2]](a) | 0;
          b = hd(b);
          J[(a + 36) >> 2] = b;
          ((c = a),
            (d = oa[J[(J[b >> 2] + 28) >> 2]](b) | 0),
            (H[(c + 44) | 0] = d));
        }
        function kc(a, b, c, d, e) {
          var f = 0,
            g = 0;
          f = J[(a + 4) >> 2];
          g = f >> 8;
          a = J[a >> 2];
          if (f & 1) {
            g = J[(J[c >> 2] + g) >> 2];
          }
          oa[J[(J[a >> 2] + 24) >> 2]](a, b, (c + g) | 0, f & 2 ? d : 2, e);
        }
        function Qd(a) {
          a = a | 0;
          var b = 0,
            c = 0,
            d = 0;
          J[a >> 2] = 15964;
          b = J[(a + 4) >> 2];
          c = (b - 4) | 0;
          d = (J[c >> 2] - 1) | 0;
          J[c >> 2] = d;
          if ((d | 0) < 0) {
            Aa((b - 12) | 0);
          }
          return a | 0;
        }
        function xe(a, b, c, d, e, f) {
          a = oa[J[(J[(a + 8) >> 2] + 4) >> 2]]((a + 8) | 0) | 0;
          a = (rc(c, d, a, (a + 288) | 0, f, e, 0) - a) | 0;
          if ((a | 0) <= 287) {
            J[b >> 2] = (((a | 0) / 12) | 0) % 12;
          }
        }
        function Ph(a, b, c, d) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          while (1) {
            if ((b | 0) != (c | 0)) {
              J[d >> 2] = H[b | 0];
              d = (d + 4) | 0;
              b = (b + 1) | 0;
              continue;
            }
            break;
          }
          return b | 0;
        }
        function Ae(a, b, c, d, e, f) {
          a = oa[J[(J[(a + 8) >> 2] + 4) >> 2]]((a + 8) | 0) | 0;
          a = (tc(c, d, a, (a + 288) | 0, f, e, 0) - a) | 0;
          if ((a | 0) <= 287) {
            J[b >> 2] = (((a | 0) / 12) | 0) % 12;
          }
        }
        function Hh(a, b, c, d) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          while (1) {
            if ((b | 0) != (c | 0)) {
              H[d | 0] = K[b | 0];
              d = (d + 1) | 0;
              b = (b + 1) | 0;
              continue;
            }
            break;
          }
          return b | 0;
        }
        function Wd(a) {
          var b = 0,
            c = 0;
          b = 21004;
          c = (ka - 16) | 0;
          ka = c;
          a: {
            if (!((H[21124] & 1) | (a >>> 0 > 30))) {
              H[21124] = 1;
              break a;
            }
            b = Jb(a);
          }
          ka = (c + 16) | 0;
          return b;
        }
        function ye(a, b, c, d, e, f) {
          a = oa[J[J[(a + 8) >> 2] >> 2]]((a + 8) | 0) | 0;
          a = (rc(c, d, a, (a + 168) | 0, f, e, 0) - a) | 0;
          if ((a | 0) <= 167) {
            J[b >> 2] = (((a | 0) / 12) | 0) % 7;
          }
        }
        function ui(a, b, c, d, e) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          a = J[(c + 4) >> 2];
          J[(c + 4) >> 2] = (a & -16971) | 520;
          b = De(b, c, d, e);
          J[(c + 4) >> 2] = a;
          return b | 0;
        }
        function Ci(a, b, c, d, e) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          a = J[(c + 4) >> 2];
          J[(c + 4) >> 2] = (a & -16971) | 520;
          b = Fe(b, c, d, e);
          J[(c + 4) >> 2] = a;
          return b | 0;
        }
        function Be(a, b, c, d, e, f) {
          a = oa[J[J[(a + 8) >> 2] >> 2]]((a + 8) | 0) | 0;
          a = (tc(c, d, a, (a + 168) | 0, f, e, 0) - a) | 0;
          if ((a | 0) <= 167) {
            J[b >> 2] = (((a | 0) / 12) | 0) % 7;
          }
        }
        function jf(a, b) {
          var c = 0,
            d = 0;
          c = (ka - 16) | 0;
          ka = c;
          d = (c + 12) | 0;
          Ha(d, a);
          a = eb(d);
          a = oa[J[(J[a >> 2] + 28) >> 2]](a, b) | 0;
          fb(d);
          ka = (c + 16) | 0;
          return a;
        }
        function Bb(a, b, c, d) {
          var e = 0,
            f = 0;
          e = b;
          f = J[(a + 4) >> 2];
          b = ek(b, c, d);
          if ((e | 0) == J[(f + (b << 2)) >> 2]) {
            a = K[(b + J[(a + 8) >> 2]) | 0];
          } else {
            a = 0;
          }
          return a;
        }
        function ge(a, b, c, d, e) {
          var f = 0,
            g = 0,
            h = 0;
          f = (ka - 16) | 0;
          ka = f;
          ((g = f), (h = tb(e)), (J[(g + 12) >> 2] = h));
          a = bc(a, b, c, d);
          wb((f + 12) | 0);
          ka = (f + 16) | 0;
          return a;
        }
        function Qj(a) {
          a = a | 0;
          var b = 0,
            c = 0;
          b = -1;
          if ((oa[J[(J[a >> 2] + 36) >> 2]](a) | 0) != -1) {
            c = J[(a + 12) >> 2];
            b = J[c >> 2];
            J[(a + 12) >> 2] = c + 4;
          }
          return b | 0;
        }
        function Nd(a, b) {
          J[a >> 2] = b;
          me((a + 4) | 0);
          J[(a + 24) >> 2] = 0;
          J[(a + 28) >> 2] = 0;
          J[(a + 16) >> 2] = 0;
          J[(a + 20) >> 2] = 0;
          J[(a + 8) >> 2] = 0;
          J[(a + 12) >> 2] = 0;
          return a;
        }
        function Uj(a) {
          a = a | 0;
          var b = 0,
            c = 0;
          b = -1;
          if ((oa[J[(J[a >> 2] + 36) >> 2]](a) | 0) != -1) {
            c = J[(a + 12) >> 2];
            b = K[c | 0];
            J[(a + 12) >> 2] = c + 1;
          }
          return b | 0;
        }
        function pe(a) {
          var b = 0;
          b = J[5249];
          a = (b + (a << 2)) | 0;
          while (1) {
            if ((a | 0) == (b | 0)) {
              J[5249] = a;
            } else {
              J[b >> 2] = 0;
              b = (b + 4) | 0;
              continue;
            }
            break;
          }
        }
        function fe(a) {
          var b = 0,
            c = 0,
            d = 0;
          b = (ka - 16) | 0;
          ka = b;
          ((c = b), (d = tb(a)), (J[(c + 12) >> 2] = d));
          a = J[J[4844] >> 2];
          wb((b + 12) | 0);
          ka = (b + 16) | 0;
          return a ? 4 : 1;
        }
        function Nc(a, b) {
          var c = 0,
            d = 0;
          c = ((b >>> 0) / 1e4) | 0;
          d = L[((c << 1) + 14416) >> 1];
          H[a | 0] = d;
          H[(a + 1) | 0] = d >>> 8;
          return Oc((a + 2) | 0, (b - P(c, 1e4)) | 0);
        }
        function Mc(a, b) {
          var c = 0,
            d = 0;
          c = ((b >>> 0) / 1e6) | 0;
          d = L[((c << 1) + 14416) >> 1];
          H[a | 0] = d;
          H[(a + 1) | 0] = d >>> 8;
          return Nc((a + 2) | 0, (b - P(c, 1e6)) | 0);
        }
        function Cc(a, b) {
          J[(a + 4) >> 2] = b;
          H[a | 0] = 0;
          b = (J[(J[b >> 2] - 12) >> 2] + b) | 0;
          if (!J[(b + 16) >> 2]) {
            b = J[(b + 72) >> 2];
            if (b) {
              gc(b);
            }
            H[a | 0] = 1;
          }
          return a;
        }
        function Cb(a, b, c, d) {
          var e = 0;
          e = J[(a + 4) >> 2];
          c = ek(b, c, d);
          if (L[(e + (c << 1)) >> 1] == (b & 65535)) {
            a = K[(c + J[(a + 8) >> 2]) | 0];
          } else {
            a = 0;
          }
          return a;
        }
        function zd(a) {
          var b = 0;
          a: {
            if (K[(a + 80) | 0] == 1) {
              b = J[(a + 76) >> 2];
              break a;
            }
            b = jf(a, 32);
            J[(a + 76) >> 2] = b;
            H[(a + 80) | 0] = 1;
          }
          return (b << 24) >> 24;
        }
        function ff(a, b, c, d, e, f) {
          J[a >> 2] = b;
          J[(a + 4) >> 2] = c;
          J[(a + 8) >> 2] = d;
          J[(a + 12) >> 2] =
            (e & 65535) |
            ((((f >>> 16) & 32768) | ((e & 2147418112) >>> 16)) << 16);
        }
        function Rc(a, b, c) {
          var d = 0,
            e = 0,
            f = 0;
          d = (ka - 16) | 0;
          ka = d;
          ((e = d), (f = tb(c)), (J[(e + 12) >> 2] = f));
          a = xc(a, b);
          wb((d + 12) | 0);
          ka = (d + 16) | 0;
          return a;
        }
        function Ka(a) {
          var b = 0;
          a: {
            if ((a | 0) == 20984) {
              break a;
            }
            b = J[(a + 4) >> 2];
            J[(a + 4) >> 2] = b - 1;
            if (b) {
              break a;
            }
            oa[J[(J[a >> 2] + 8) >> 2]](a);
          }
        }
        function mb(a) {
          a: {
            a = J[(a + 4) >> 2] & 74;
            if (a) {
              if ((a | 0) == 64) {
                return 8;
              }
              if ((a | 0) != 8) {
                break a;
              }
              return 16;
            }
            return 0;
          }
          return 10;
        }
        function pb(a, b, c) {
          if (!c) {
            return J[(a + 4) >> 2] == J[(b + 4) >> 2];
          }
          if ((a | 0) == (b | 0)) {
            return 1;
          }
          return !vc(J[(a + 4) >> 2], J[(b + 4) >> 2]);
        }
        function ze(a, b, c, d, e) {
          b = lb(b, c, d, e, 4);
          if (!(K[d | 0] & 4)) {
            J[a >> 2] =
              ((b | 0) < 69
                ? (b + 2e3) | 0
                : b >>> 0 < 100
                  ? (b + 1900) | 0
                  : b) - 1900;
          }
        }
        function zc(a) {
          a = a | 0;
          var b = 0;
          b = J[1304];
          J[a >> 2] = b;
          J[(J[(b - 12) >> 2] + a) >> 2] = J[1307];
          md((a + 8) | 0);
          ub((a + 108) | 0);
          return a | 0;
        }
        function we(a, b, c, d, e) {
          b = kb(b, c, d, e, 4);
          if (!(K[d | 0] & 4)) {
            J[a >> 2] =
              ((b | 0) < 69
                ? (b + 2e3) | 0
                : b >>> 0 < 100
                  ? (b + 1900) | 0
                  : b) - 1900;
          }
        }
        function ne(a, b) {
          var c = 0;
          c = J[(a + 12) >> 2];
          a = J[(a + 8) >> 2];
          if (((c - a) >> 2) >>> 0 > b >>> 0) {
            a = J[(a + (b << 2)) >> 2] != 0;
          } else {
            a = 0;
          }
          return a;
        }
        function he(a, b, c, d, e, f, g, h) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          f = f | 0;
          g = g | 0;
          h = h | 0;
          J[e >> 2] = c;
          J[h >> 2] = f;
          return 3;
        }
        function db(a) {
          var b = 0;
          b = J[(a + 12) >> 2];
          if ((b | 0) == J[(a + 16) >> 2]) {
            oa[J[(J[a >> 2] + 40) >> 2]](a) | 0;
            return;
          }
          J[(a + 12) >> 2] = b + 1;
        }
        function cb(a) {
          var b = 0;
          b = J[(a + 12) >> 2];
          if ((b | 0) == J[(a + 16) >> 2]) {
            oa[J[(J[a >> 2] + 40) >> 2]](a) | 0;
            return;
          }
          J[(a + 12) >> 2] = b + 4;
        }
        function _a(a) {
          var b = 0;
          b = J[(a + 12) >> 2];
          if ((b | 0) == J[(a + 16) >> 2]) {
            return oa[J[(J[a >> 2] + 36) >> 2]](a) | 0;
          }
          return J[b >> 2];
        }
        function $a(a) {
          var b = 0;
          b = J[(a + 12) >> 2];
          if ((b | 0) == J[(a + 16) >> 2]) {
            return oa[J[(J[a >> 2] + 36) >> 2]](a) | 0;
          }
          return K[b | 0];
        }
        function ld(a) {
          if (!J[(a + 136) >> 2]) {
            J[(a + 136) >> 2] = J[J[4844] >> 2] ? 5536 : 5512;
          }
          if (!J[(a + 72) >> 2]) {
            J[(a + 72) >> 2] = 1;
          }
        }
        function wg(a, b, c, d, e, f) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          f = f | 0;
          if (pb(a, J[(b + 8) >> 2], f)) {
            Kc(b, c, d, e);
          }
        }
        function ie(a) {
          a = a | 0;
          var b = 0;
          J[a >> 2] = 7788;
          b = J[(a + 8) >> 2];
          if (!(!b | !(H[(a + 12) | 0] & 1))) {
            Aa(b);
          }
          return a | 0;
        }
        function Nf(a, b, c, d) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          J[(a + 8) >> 2] = -1;
          J[(a + 12) >> 2] = -1;
          J[a >> 2] = 0;
          J[(a + 4) >> 2] = 0;
        }
        function Xe(a) {
          var b = 0,
            c = 0;
          c = a;
          while (1) {
            b = c;
            c = (b + 4) | 0;
            if (J[b >> 2]) {
              continue;
            }
            break;
          }
          return (b - a) >> 2;
        }
        function zf(a) {
          var b = 0;
          b = J[a >> 2];
          if (b) {
            if ((_a(b) | 0) != -1) {
              return !J[a >> 2];
            }
            J[a >> 2] = 0;
          }
          return 1;
        }
        function Af(a) {
          var b = 0;
          b = J[a >> 2];
          if (b) {
            if (($a(b) | 0) != -1) {
              return !J[a >> 2];
            }
            J[a >> 2] = 0;
          }
          return 1;
        }
        function tb(a) {
          var b = 0;
          b = J[4844];
          if (a) {
            J[4844] = (a | 0) == -1 ? 17164 : a;
          }
          return (b | 0) == 17164 ? -1 : b;
        }
        function fk(a, b) {
          var c = 0,
            d = 0;
          c = b & 31;
          d = ((-1 >>> c) & a) << c;
          c = a;
          a = (0 - b) & 31;
          return d | ((c & (-1 << a)) >>> a);
        }
        function ci(a, b, c, d, e, f, g, h, i) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          f = f | 0;
          g = g | 0;
          h = h | 0;
          i = i | 0;
          y();
        }
        function Fg(a, b, c, d) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          if (J[(a + 4) >> 2] == J[(J[(b + 8) >> 2] + 4) >> 2]) {
            Lc(b, c, d);
          }
        }
        function le(a) {
          a = a | 0;
          var b = 0;
          a = J[J[J[a >> 2] >> 2] >> 2];
          b = (J[5289] + 1) | 0;
          J[5289] = b;
          J[(a + 4) >> 2] = b;
        }
        function gb(a, b) {
          a = J[a >> 2];
          b = Ga(b);
          if (!ne(a, b)) {
            Oa();
            y();
          }
          return J[(J[(a + 8) >> 2] + (b << 2)) >> 2];
        }
        function Dh(a, b, c, d, e) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          a = (d - c) | 0;
          return (a >>> 0 < e >>> 0 ? a : e) | 0;
        }
        function ob(a, b) {
          b = !J[(a + 24) >> 2] | (J[(a + 16) >> 2] | b);
          J[(a + 16) >> 2] = b;
          if (b & J[(a + 20) >> 2]) {
            ud();
            y();
          }
        }
        function Ke(a, b, c) {
          var d = 0;
          d = (ka - 16) | 0;
          ka = d;
          a = kf(a, H[c | 0], (b - a) | 0);
          ka = (d + 16) | 0;
          return a ? a : b;
        }
        function Db(a, b) {
          b = J[b >> 2];
          J[a >> 2] = b;
          if ((b | 0) != 20984) {
            J[(b + 4) >> 2] = J[(b + 4) >> 2] + 1;
          }
          return a;
        }
        function Ab(a, b, c, d) {
          c = ek(b, c, d);
          return K[(c + J[(a + 4) >> 2]) | 0] == (b & 255)
            ? K[(c + J[(a + 8) >> 2]) | 0]
            : 0;
        }
        function ih(a) {
          a = a | 0;
          a = 21560;
          while (1) {
            a = ya((a - 12) | 0);
            if ((a | 0) != 21392) {
              continue;
            }
            break;
          }
        }
        function gh(a) {
          a = a | 0;
          a = 21736;
          while (1) {
            a = ya((a - 12) | 0);
            if ((a | 0) != 21568) {
              continue;
            }
            break;
          }
        }
        function dh(a) {
          a = a | 0;
          a = 22032;
          while (1) {
            a = ya((a - 12) | 0);
            if ((a | 0) != 21744) {
              continue;
            }
            break;
          }
        }
        function bh(a) {
          a = a | 0;
          a = 22336;
          while (1) {
            a = ya((a - 12) | 0);
            if ((a | 0) != 22048) {
              continue;
            }
            break;
          }
        }
        function Zg(a) {
          a = a | 0;
          a = 22408;
          while (1) {
            a = ya((a - 12) | 0);
            if ((a | 0) != 22384) {
              continue;
            }
            break;
          }
        }
        function Ra(a, b) {
          J[a >> 2] = b;
          b = J[(a + 4) >> 2];
          if (b) {
            Aa(b);
          }
          b = J[(a + 8) >> 2];
          if (b) {
            Aa(b);
          }
          return a;
        }
        function $g(a) {
          a = a | 0;
          a = 22376;
          while (1) {
            a = ya((a - 12) | 0);
            if ((a | 0) != 22352) {
              continue;
            }
            break;
          }
        }
        function qe(a) {
          a = a | 0;
          J[a >> 2] = 8872;
          if (J[(a + 8) >> 2] != (Xa() | 0)) {
            Ye(J[(a + 8) >> 2]);
          }
          return a | 0;
        }
        function vi(a, b, c, d, e, f, g, h) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          f = f | 0;
          g = g | 0;
          h = h | 0;
          y();
        }
        function mf(a) {
          return (
            ((a | 0) != 0) &
            ((a | 0) != 5512) &
            ((a | 0) != 5536) &
            ((a | 0) != 20608) &
            ((a | 0) != 20632)
          );
        }
        function Xh(a, b, c) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          return ((J[((c << 2) + 7840) >> 2] & b) != 0) & (c >>> 0 <= 127);
        }
        function Sf(a, b, c, d) {
          if (J[(a + 76) >> 2] < 0) {
            return Tf(a, b, c, d);
          }
          return Tf(a, b, c, d);
        }
        function yi(a, b, c, d, e) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          return De(b, c, d, e) | 0;
        }
        function Wg(a) {
          a = a | 0;
          if (!K[21300]) {
            Kb(21288, 9036);
            H[21300] = 1;
          }
          return 21288;
        }
        function Sg(a) {
          a = a | 0;
          if (!K[21316]) {
            Kb(21304, 9072);
            H[21316] = 1;
          }
          return 21304;
        }
        function Qg(a) {
          a = a | 0;
          if (!K[21332]) {
            Eb(21320, 1882);
            H[21332] = 1;
          }
          return 21320;
        }
        function Og(a) {
          a = a | 0;
          if (!K[21348]) {
            Kb(21336, 9108);
            H[21348] = 1;
          }
          return 21336;
        }
        function Mg(a) {
          a = a | 0;
          if (!K[21364]) {
            Eb(21352, 1648);
            H[21364] = 1;
          }
          return 21352;
        }
        function Jg(a) {
          a = a | 0;
          if (!K[21380]) {
            Kb(21368, 9192);
            H[21380] = 1;
          }
          return 21368;
        }
        function Ei(a, b, c, d, e) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          return Fe(b, c, d, e) | 0;
        }
        function fi(a, b, c, d, e, f, g) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          f = f | 0;
          g = g | 0;
          y();
        }
        function Ub(a, b, c, d, e) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          J[e >> 2] = c;
          return 3;
        }
        function xb(a, b) {
          a = a | 0;
          b = b | 0;
          H[a | 0] = 2;
          H[(a + 1) | 0] = 3;
          H[(a + 2) | 0] = 0;
          H[(a + 3) | 0] = 4;
        }
        function $j(a) {
          a = a | 0;
          a = J[4143];
          if (a) {
            oa[J[(J[a >> 2] + 28) >> 2]](a);
          }
          kd(16560);
        }
        function Pc(a) {
          a = a | 0;
          if (J[(a + 8) >> 2] != (Xa() | 0)) {
            Ye(J[(a + 8) >> 2]);
          }
          return a | 0;
        }
        function ai(a, b, c, d, e, f) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          f = f | 0;
          Tb(a, f);
        }
        function Bd(a) {
          a = Hc(J[a >> 2], J[(a + 4) >> 2], J[(a + 8) >> 2], J[(a + 12) >> 2]);
          return a;
        }
        function Yf(a) {
          var b = 0;
          b = J[a >> 2];
          a = J[b >> 2];
          if (a) {
            J[(b + 4) >> 2] = a;
            Aa(a);
          }
        }
        function Th(a, b) {
          a = a | 0;
          b = b | 0;
          return ((b - 123) >>> 0 < 4294967270 ? b : b & 95) | 0;
        }
        function Oh(a, b, c) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          return ((b >>> 0 < 128 ? b : c) << 24) >> 24;
        }
        function vh(a, b, c) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          return Ab(a, b, c, 134217757) | 0;
        }
        function kg(a, b, c) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          return Cb(a, b, c, 134217757) | 0;
        }
        function _f(a, b, c) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          return Bb(a, b, c, 134217757) | 0;
        }
        function Rh(a, b) {
          a = a | 0;
          b = b | 0;
          return ((b - 91) >>> 0 < 4294967270 ? b : b | 32) | 0;
        }
        function Lh(a, b) {
          a = a | 0;
          b = b | 0;
          return (((b - 123) & 255) >>> 0 < 230 ? b : b & 95) | 0;
        }
        function zi(a, b, c) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          return Ab(a, b, c, 16777259) | 0;
        }
        function xi(a, b, c, d, e, f) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          f = f | 0;
          y();
        }
        function qg(a, b, c) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          return Cb(a, b, c, 16777259) | 0;
        }
        function og(a, b, c) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          return Cb(a, b, c, 33554467) | 0;
        }
        function mg(a, b, c) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          return Cb(a, b, c, 67108879) | 0;
        }
        function gi(a, b, c) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          return Ab(a, b, c, 33554467) | 0;
        }
        function cg(a, b, c) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          return Bb(a, b, c, 33554467) | 0;
        }
        function ag(a, b, c) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          return Bb(a, b, c, 67108879) | 0;
        }
        function Yh(a, b, c) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          return Ab(a, b, c, 67108879) | 0;
        }
        function Of(a, b, c, d, e, f) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          f = f | 0;
          y();
        }
        function Kf(a) {
          a = a | 0;
          a = (J[(J[a >> 2] - 12) >> 2] + a) | 0;
          ub((a + 8) | 0);
          return a | 0;
        }
        function Jh(a, b) {
          a = a | 0;
          b = b | 0;
          return (((b - 91) & 255) >>> 0 < 230 ? b : b | 32) | 0;
        }
        function Hf(a) {
          a = a | 0;
          a = (J[(J[a >> 2] - 12) >> 2] + a) | 0;
          ub((a + 4) | 0);
          return a | 0;
        }
        function Df(a, b, c) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          return Bb(a, b, c, 16777259) | 0;
        }
        function wh(a) {
          a = a | 0;
          a = J[(a + 8) >> 2];
          if (!a) {
            return 1;
          }
          return fe(a) | 0;
        }
        function tg(a, b, c) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          return Cb(a, b, c, 8388617) | 0;
        }
        function mj(a, b, c, d, e, f) {
          a = a | 0;
          b = +b;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          f = f | 0;
          y();
        }
        function jj(a, b, c) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          return Ab(a, b, c, 2097169) | 0;
        }
        function ig(a, b, c) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          return Bb(a, b, c, 2097169) | 0;
        }
        function gg(a, b, c) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          return Bb(a, b, c, 4194319) | 0;
        }
        function eg(a, b, c) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          return Bb(a, b, c, 8388617) | 0;
        }
        function _i(a, b, c) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          return Ab(a, b, c, 4194319) | 0;
        }
        function Ni(a, b, c) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          return Ab(a, b, c, 8388617) | 0;
        }
        function Lg(a, b, c) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          return Cb(a, b, c, 2097169) | 0;
        }
        function Cg(a, b, c) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          return Cb(a, b, c, 4194319) | 0;
        }
        function bb(a, b) {
          a = a | 0;
          b = b | 0;
          J[(a + 8) >> 2] = 0;
          J[a >> 2] = 0;
          J[(a + 4) >> 2] = 0;
        }
        function Jb(a) {
          if (a >>> 0 >= 1073741824) {
            Oa();
            y();
          }
          return za(a << 2);
        }
        function Uf(a) {
          J[(a + 80) >> 2] = -1;
          J[(a + 48) >> 2] = 0;
          J[a >> 2] = J[a >> 2] | 64;
        }
        function Bj(a) {
          a = a | 0;
          gc(19572);
          gc(19860);
          nd(20160);
          nd(20448);
        }
        function Vd(a, b) {
          if ((a | 0) == (b | 0)) {
            H[(a + 120) | 0] = 0;
            return;
          }
          Aa(b);
        }
        function Yg(a) {
          a = a | 0;
          if (!K[21285]) {
            H[21285] = 1;
          }
          return 16536;
        }
        function Ug(a) {
          a = a | 0;
          if (!K[21301]) {
            H[21301] = 1;
          }
          return 16548;
        }
        function Gh(a, b, c) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          return ((b | 0) < 0 ? c : b) | 0;
        }
        function Cj(a, b, c, d) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          na = 0;
          return 0;
        }
        function wi(a, b, c, d, e) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = +e;
          y();
        }
        function _d(a) {
          a = a | 0;
          J[a >> 2] = 8920;
          ya((a + 12) | 0);
          return a | 0;
        }
        function Zd(a) {
          a = a | 0;
          J[a >> 2] = 8960;
          ya((a + 16) | 0);
          return a | 0;
        }
        function od(a) {
          a = a | 0;
          J[a >> 2] = 4456;
          fb((a + 4) | 0);
          return a | 0;
        }
        function Fj(a) {
          a = a | 0;
          return zc((J[(J[a >> 2] - 12) >> 2] + a) | 0) | 0;
        }
        function Fc(a) {
          a = a | 0;
          J[a >> 2] = 4312;
          fb((a + 4) | 0);
          return a | 0;
        }
        function We(a, b, c) {
          a = hf(a, b, c, 0, -2147483648);
          return a;
        }
        function Qb(a, b) {
          a = Vf(a, b);
          return K[a | 0] == (b & 255) ? a : 0;
        }
        function ya(a) {
          if (H[(a + 11) | 0] < 0) {
            Aa(J[a >> 2]);
          }
          return a;
        }
        function ck(a) {
          if (a) {
            return (31 - S((a - 1) ^ a)) | 0;
          }
          return 32;
        }
        function ic(a) {
          if (!a) {
            return 0;
          }
          J[4158] = a;
          return -1;
        }
        function Xj(a) {
          a = a | 0;
          return ic($(J[(a + 60) >> 2]) | 0) | 0;
        }
        function vf(a, b) {
          if (!a) {
            return 0;
          }
          return xc(a, b);
        }
        function Pf(a, b, c) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          return a | 0;
        }
        function re(a, b, c) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          return -1;
        }
        function bd(a, b, c) {
          a = hf(a, b, c, -1, -1);
          return a;
        }
        function Jf(a) {
          a = a | 0;
          qd((J[(J[a >> 2] - 12) >> 2] + a) | 0);
        }
        function Gf(a) {
          a = a | 0;
          pd((J[(J[a >> 2] - 12) >> 2] + a) | 0);
        }
        function Ej(a) {
          a = a | 0;
          Bf((J[(J[a >> 2] - 12) >> 2] + a) | 0);
        }
        function ek(a, b, c) {
          bk(a, b, c);
          na = ma;
          return la;
        }
        function Zh(a) {
          a = a | 0;
          oa[J[(J[a >> 2] + 4) >> 2]](a);
        }
        function wd(a, b, c) {
          if (c) {
            D(a, (b << 24) >> 24, c);
          }
        }
        function ph(a, b) {
          a = a | 0;
          b = b | 0;
          Tb(a, (b + 12) | 0);
        }
        function oh(a, b) {
          a = a | 0;
          b = b | 0;
          Tb(a, (b + 16) | 0);
        }
        function _b(a) {
          return ($a(J[a >> 2]) << 24) >> 24;
        }
        function Lf(a) {
          a = a | 0;
          ub((a + 8) | 0);
          return a | 0;
        }
        function If(a) {
          a = a | 0;
          ub((a + 4) | 0);
          return a | 0;
        }
        function yb(a) {
          return ((a | 0) == 32) | ((a - 9) >>> 0 < 5);
        }
        function te(a) {
          a = a | 0;
          return Ra(a, 2584) | 0;
        }
        function lf(a) {
          return (a - 65) >>> 0 < 26 ? a | 32 : a;
        }
        function kd(a) {
          a = a | 0;
          return Ra(a, 1032) | 0;
        }
        function je(a) {
          a = a | 0;
          return Ra(a, 2692) | 0;
        }
        function ef(a) {
          a = a | 0;
          return Ra(a, 2152) | 0;
        }
        function Yd(a) {
          a = a | 0;
          return Ra(a, 2800) | 0;
        }
        function Ue(a) {
          a = a | 0;
          return Ra(a, 2260) | 0;
        }
        function Ud(a) {
          a = a | 0;
          return Ra(a, 2908) | 0;
        }
        function Pd(a) {
          a = a | 0;
          return Ra(a, 3016) | 0;
        }
        function Ob(a) {
          return (a - 97) >>> 0 < 26 ? a & 95 : a;
        }
        function Md(a) {
          a = a | 0;
          return Ra(a, 3124) | 0;
        }
        function Ld(a) {
          a = a | 0;
          return Ra(a, 3232) | 0;
        }
        function Kd(a) {
          a = a | 0;
          return Ra(a, 3340) | 0;
        }
        function Jd(a) {
          a = a | 0;
          return Ra(a, 3448) | 0;
        }
        function Id(a) {
          a = a | 0;
          return Ra(a, 3556) | 0;
        }
        function He(a) {
          a = a | 0;
          return Ra(a, 2368) | 0;
        }
        function Hd(a) {
          a = a | 0;
          return Ra(a, 3664) | 0;
        }
        function Gd(a) {
          a = a | 0;
          return Ra(a, 3772) | 0;
        }
        function Ed(a) {
          a = a | 0;
          return Ra(a, 3880) | 0;
        }
        function Dd(a) {
          a = a | 0;
          return Ra(a, 3988) | 0;
        }
        function Ce(a) {
          a = a | 0;
          return Ra(a, 2476) | 0;
        }
        function Cd(a) {
          a = a | 0;
          return Ra(a, 4096) | 0;
        }
        function Ad(a) {
          a = a | 0;
          return Ra(a, 4204) | 0;
        }
        function ve(a, b) {
          a = a | 0;
          b = b | 0;
          Td(a, 1, 45);
        }
        function ue(a, b) {
          a = a | 0;
          b = b | 0;
          Sd(a, 1, 45);
        }
        function nh(a, b) {
          a = a | 0;
          b = b | 0;
          Eb(a, 1756);
        }
        function mh(a, b) {
          a = a | 0;
          b = b | 0;
          Kb(a, 8992);
        }
        function lh(a, b) {
          a = a | 0;
          b = b | 0;
          Eb(a, 1765);
        }
        function kh(a, b) {
          a = a | 0;
          b = b | 0;
          Kb(a, 9012);
        }
        function ke(a, b) {
          a = a | 0;
          b = b | 0;
          return b | 0;
        }
        function qh(a) {
          a = a | 0;
          return J[(a + 12) >> 2];
        }
        function lc(a) {
          a = a | 0;
          return 2147483647;
        }
        function zj(a) {
          a = a | 0;
          return sf(a, 0) | 0;
        }
        function yj(a) {
          a = a | 0;
          return sf(a, 1) | 0;
        }
        function wb(a) {
          a = J[a >> 2];
          if (a) {
            tb(a);
          }
        }
        function sj(a) {
          a = a | 0;
          return pf(a, 0) | 0;
        }
        function rj(a) {
          a = a | 0;
          return pf(a, 1) | 0;
        }
        function Qc(a) {
          a = a | 0;
          return 134217757;
        }
        function Qa(a) {
          a = a | 0;
          return J[(a + 4) >> 2];
        }
        function Pa(a) {
          a = a | 0;
          return J[(a + 8) >> 2];
        }
        function Ma(a, b) {
          return Af(a) ^ Af(b) ^ 1;
        }
        function La(a, b) {
          return zf(a) ^ zf(b) ^ 1;
        }
        function Dc(a, b) {
          a = a | 0;
          b = b | 0;
          return -1;
        }
        function sh(a) {
          a = a | 0;
          return H[(a + 8) | 0];
        }
        function sd(a) {
          a = a | 0;
          return 16777259;
        }
        function rh(a) {
          a = a | 0;
          return H[(a + 9) | 0];
        }
        function qd(a) {
          a = a | 0;
          ub((a + 8) | 0);
          Aa(a);
        }
        function pd(a) {
          a = a | 0;
          ub((a + 4) | 0);
          Aa(a);
        }
        function Tc(a) {
          a = a | 0;
          return 33554467;
        }
        function Sc(a) {
          a = a | 0;
          return 67108879;
        }
        function sc(a) {
          db(J[a >> 2]);
          return a;
        }
        function qc(a) {
          cb(J[a >> 2]);
          return a;
        }
        function ed(a) {
          a = a | 0;
          return 2097169;
        }
        function Yc(a) {
          a = a | 0;
          return 8388617;
        }
        function $c(a) {
          a = a | 0;
          return 4194319;
        }
        function vb(a, b, c) {
          if (c) {
            z(a, b, c);
          }
        }
        function ib(a) {
          return gb(a, 21160);
        }
        function hd(a) {
          return gb(a, 21184);
        }
        function ec(a) {
          return gb(a, 21176);
        }
        function eb(a) {
          return gb(a, 21168);
        }
        function Yb(a) {
          return gb(a, 21232);
        }
        function Xb(a) {
          return _a(J[a >> 2]);
        }
        function $b(a) {
          return gb(a, 21224);
        }
        function vg(a) {
          a = a | 0;
          return 1694;
        }
        function rd(a) {
          return Nd(a, 4312);
        }
        function Wj(a) {
          a = a | 0;
          Fc(a);
          Aa(a);
        }
        function Sj(a) {
          a = a | 0;
          od(a);
          Aa(a);
        }
        function Od(a) {
          a = a | 0;
          Qd(a);
          Aa(a);
        }
        function Nj(a) {
          a = a | 0;
          md(a);
          Aa(a);
        }
        function Ef(a) {
          return Nd(a, 4456);
        }
        function mc(a) {
          a = a | 0;
          return 127;
        }
        function Ye(a) {
          if (mf(a)) {
            Aa(a);
          }
        }
        function Ib(a) {
          a = a | 0;
          return a | 0;
        }
        function uh(a) {
          a = a | 0;
          Aa(_d(a));
        }
        function ug(a) {
          a = a | 0;
          Aa(Pd(a));
        }
        function th(a) {
          a = a | 0;
          Aa(Zd(a));
        }
        function tf(a) {
          a = a | 0;
          Aa(Fc(a));
        }
        function rg(a) {
          a = a | 0;
          Aa(Md(a));
        }
        function qf(a) {
          a = a | 0;
          Aa(od(a));
        }
        function pg(a) {
          a = a | 0;
          Aa(Ld(a));
        }
        function oi(a) {
          a = a | 0;
          Aa(Ce(a));
        }
        function ng(a) {
          a = a | 0;
          Aa(Kd(a));
        }
        function lg(a) {
          a = a | 0;
          Aa(Jd(a));
        }
        function jg(a) {
          a = a | 0;
          Aa(Id(a));
        }
        function ij(a) {
          a = a | 0;
          Aa(ef(a));
        }
        function hg(a) {
          a = a | 0;
          Aa(Hd(a));
        }
        function fg(a) {
          a = a | 0;
          Aa(Gd(a));
        }
        function ei(a) {
          a = a | 0;
          Aa(te(a));
        }
        function eh(a) {
          a = a | 0;
          Aa(Yd(a));
        }
        function dg(a) {
          a = a | 0;
          Aa(Ed(a));
        }
        function bg(a) {
          a = a | 0;
          Aa(Dd(a));
        }
        function _h(a) {
          a = a | 0;
          Aa(oe(a));
        }
        function Zf(a) {
          a = a | 0;
          Aa(Ad(a));
        }
        function Xg(a) {
          a = a | 0;
          ya(16536);
        }
        function Xd(a) {
          a = a | 0;
          Aa(Pc(a));
        }
        function Vg(a) {
          a = a | 0;
          ya(21288);
        }
        function Ui(a) {
          a = a | 0;
          Aa(Ue(a));
        }
        function Tg(a) {
          a = a | 0;
          ya(16548);
        }
        function Rg(a) {
          a = a | 0;
          ya(21304);
        }
        function Pg(a) {
          a = a | 0;
          ya(21320);
        }
        function Oj(a) {
          a = a | 0;
          Aa(kd(a));
        }
        function Ng(a) {
          a = a | 0;
          ya(21336);
        }
        function Mh(a) {
          a = a | 0;
          Aa(ie(a));
        }
        function Kg(a) {
          a = a | 0;
          ya(21352);
        }
        function Ig(a) {
          a = a | 0;
          ya(21368);
        }
        function Hg(a) {
          a = a | 0;
          Aa(Ud(a));
        }
        function Fh(a) {
          a = a | 0;
          Aa(je(a));
        }
        function Dj(a) {
          a = a | 0;
          Aa(ub(a));
        }
        function Di(a) {
          a = a | 0;
          Aa(He(a));
        }
        function Ch(a) {
          a = a | 0;
          Aa(qe(a));
        }
        function Bf(a) {
          a = a | 0;
          Aa(zc(a));
        }
        function $f(a) {
          a = a | 0;
          Aa(Cd(a));
        }
        function qb(a) {
          a = a | 0;
          return 2;
        }
        function jb(a) {
          a = a | 0;
          return 4;
        }
        function Ua(a) {
          a = a | 0;
          return 0;
        }
        function Mf(a) {
          a = a | 0;
          return -1;
        }
        function Ia(a) {
          a = a | 0;
          return 1;
        }
        function Ha(a, b) {
          Db(a, (b + 28) | 0);
        }
        function Ec(a, b) {
          a = a | 0;
          b = b | 0;
        }
        function fb(a) {
          Ka(J[a >> 2]);
        }
        function Na(a) {
          a = a | 0;
          Aa(a);
        }
        function ud() {
          da();
          y();
        }
        function Oa() {
          ud();
          y();
        }
        function vd(a) {
          a = a | 0;
        }
        // EMSCRIPTEN_END_FUNCS
        a = K;
        m(n);
        var oa = [
          null,
          $j,
          Qa,
          Pa,
          sd,
          jb,
          Ia,
          Df,
          kd,
          Oj,
          Qa,
          Pa,
          ed,
          Ia,
          Ia,
          jj,
          ef,
          ij,
          Qa,
          Pa,
          $c,
          Ia,
          Ia,
          _i,
          Ue,
          Ui,
          Qa,
          Pa,
          Yc,
          Ia,
          Ia,
          Ni,
          He,
          Di,
          Qa,
          Pa,
          sd,
          Ia,
          Ia,
          zi,
          Ce,
          oi,
          Qa,
          Pa,
          Tc,
          Ia,
          Ia,
          gi,
          te,
          ei,
          Qa,
          Pa,
          Sc,
          Ia,
          Ia,
          Yh,
          je,
          Fh,
          Qa,
          Pa,
          Qc,
          Ia,
          Ia,
          vh,
          Yd,
          eh,
          Qa,
          Pa,
          ed,
          qb,
          Ia,
          Lg,
          Ud,
          Hg,
          Qa,
          Pa,
          $c,
          qb,
          Ia,
          Cg,
          Pd,
          ug,
          Qa,
          Pa,
          Yc,
          qb,
          Ia,
          tg,
          Md,
          rg,
          Qa,
          Pa,
          sd,
          qb,
          Ia,
          qg,
          Ld,
          pg,
          Qa,
          Pa,
          Tc,
          qb,
          Ia,
          og,
          Kd,
          ng,
          Qa,
          Pa,
          Sc,
          qb,
          Ia,
          mg,
          Jd,
          lg,
          Qa,
          Pa,
          Qc,
          qb,
          Ia,
          kg,
          Id,
          jg,
          Qa,
          Pa,
          ed,
          jb,
          Ia,
          ig,
          Hd,
          hg,
          Qa,
          Pa,
          $c,
          jb,
          Ia,
          gg,
          Gd,
          fg,
          Qa,
          Pa,
          Yc,
          jb,
          Ia,
          eg,
          Ed,
          dg,
          Qa,
          Pa,
          Tc,
          jb,
          Ia,
          cg,
          Dd,
          bg,
          Qa,
          Pa,
          Sc,
          jb,
          Ia,
          ag,
          Cd,
          $f,
          Qa,
          Pa,
          Qc,
          jb,
          Ia,
          _f,
          Ad,
          Zf,
          Qd,
          Ib,
          _j,
          Zj,
          Yj,
          Xj,
          Fc,
          Wj,
          Ec,
          Pf,
          Of,
          Nf,
          Ua,
          Ua,
          Vj,
          Mf,
          Uj,
          Dc,
          Tj,
          Dc,
          Lf,
          qd,
          Kf,
          Jf,
          If,
          pd,
          Hf,
          Gf,
          od,
          Sj,
          Ec,
          Pf,
          Of,
          Nf,
          Ua,
          Ua,
          Rj,
          Mf,
          Qj,
          Dc,
          Pj,
          Dc,
          Lf,
          qd,
          Kf,
          Jf,
          If,
          pd,
          Hf,
          Gf,
          md,
          Nj,
          Gj,
          Jj,
          Of,
          Ij,
          Hj,
          Mj,
          Lj,
          Kj,
          zc,
          Bf,
          Fj,
          Ej,
          ub,
          Dj,
          Ua,
          Cj,
          Bj,
          tf,
          Aj,
          zj,
          yj,
          xj,
          tf,
          wj,
          rf,
          vj,
          uj,
          qf,
          tj,
          sj,
          rj,
          qj,
          qf,
          pj,
          rf,
          oj,
          nj,
          mj,
          lj,
          kj,
          hj,
          vd,
          Aa,
          le,
          ih,
          gh,
          dh,
          bh,
          $g,
          Zg,
          Xg,
          Vg,
          Tg,
          Rg,
          Pg,
          Ng,
          Kg,
          Ig,
          oe,
          _h,
          Zh,
          ie,
          Mh,
          Lh,
          Kh,
          Jh,
          Ih,
          ke,
          Hh,
          Gh,
          Eh,
          qe,
          Ch,
          Bh,
          Ah,
          zh,
          yh,
          Ua,
          xh,
          wh,
          _d,
          uh,
          sh,
          rh,
          ph,
          nh,
          lh,
          Zd,
          th,
          Pa,
          qh,
          oh,
          mh,
          kh,
          Ib,
          Na,
          Na,
          Xh,
          Wh,
          Vh,
          Uh,
          Th,
          Sh,
          Rh,
          Qh,
          ke,
          Ph,
          Oh,
          Nh,
          Na,
          he,
          he,
          Ub,
          Ia,
          Ia,
          Dh,
          Ia,
          Na,
          ee,
          de,
          Ub,
          Ua,
          Ua,
          ce,
          jb,
          Na,
          ee,
          de,
          Ub,
          Ua,
          Ua,
          ce,
          jb,
          Na,
          be,
          ae,
          Ub,
          Ua,
          Ua,
          $d,
          jb,
          Na,
          be,
          ae,
          Ub,
          Ua,
          Ua,
          $d,
          jb,
          Ib,
          Na,
          gj,
          fj,
          ej,
          Ib,
          Na,
          dj,
          cj,
          bj,
          Na,
          aj,
          Zi,
          Yi,
          Xi,
          Re,
          Re,
          Wi,
          Vi,
          Ti,
          Si,
          Ri,
          Na,
          Qi,
          Pi,
          Oi,
          Mi,
          Je,
          Je,
          Li,
          Ki,
          Ji,
          Ii,
          Hi,
          Na,
          Gi,
          Fi,
          xi,
          Ei,
          xi,
          wi,
          vi,
          Ci,
          Na,
          Bi,
          Ai,
          xi,
          yi,
          xi,
          wi,
          vi,
          ui,
          Ib,
          Na,
          qb,
          ti,
          si,
          ri,
          qi,
          pi,
          ni,
          jh,
          fh,
          ah,
          Qg,
          Mg,
          Yg,
          Ug,
          Ib,
          Na,
          qb,
          mi,
          li,
          ki,
          ji,
          ii,
          hi,
          hh,
          ch,
          _g,
          Og,
          Jg,
          Wg,
          Sg,
          Pc,
          Xd,
          fi,
          Pc,
          Xd,
          fi,
          Na,
          mc,
          mc,
          bb,
          bb,
          bb,
          ve,
          Ua,
          xb,
          xb,
          Na,
          mc,
          mc,
          bb,
          bb,
          bb,
          ve,
          Ua,
          xb,
          xb,
          Na,
          lc,
          lc,
          bb,
          bb,
          bb,
          ue,
          Ua,
          xb,
          xb,
          Na,
          lc,
          lc,
          bb,
          bb,
          bb,
          ue,
          Ua,
          xb,
          xb,
          Na,
          fi,
          fi,
          Na,
          fi,
          fi,
          Na,
          ci,
          di,
          Na,
          ci,
          bi,
          Na,
          re,
          ai,
          Ec,
          Na,
          re,
          $h,
          Ec,
          Ib,
          Na,
          vd,
          vd,
          Gg,
          wg,
          zg,
          Fg,
          Na,
          xg,
          Ag,
          Eg,
          Na,
          yg,
          Bg,
          Dg,
          Na,
          vg,
          Od,
          Qa,
          Od,
        ];
        function pa() {
          return G.byteLength >> 16;
        }
        function ua(va) {
          va = va | 0;
          var qa = pa() | 0;
          var ra = (qa + va) | 0;
          if (qa < ra && ra < 65536 && ra <= 32768) {
            var sa = new ArrayBuffer(ra << 16);
            var ta = new Int8Array(sa);
            ta.set(H);
            H = new Int8Array(sa);
            I = new Int16Array(sa);
            J = new Int32Array(sa);
            K = new Uint8Array(sa);
            L = new Uint16Array(sa);
            M = new Uint32Array(sa);
            N = new Float32Array(sa);
            O = new Float64Array(sa);
            G = sa;
            a = K;
          }
          return qa;
        }
        return {
          m: Object.create(Object.prototype, {
            grow: { value: ua },
            buffer: {
              get: function () {
                return G;
              },
            },
          }),
          n: ak,
          o: $i,
          p: sg,
          q: Wa,
          r: Aa,
        };
      }
      return wa(xa);
    })(
      // EMSCRIPTEN_END_ASM

      info,
    );
  },
  instantiate: function (binary, info) {
    return {
      then: function (ok) {
        var module = new WebAssembly.Module(binary);
        ok({ instance: new WebAssembly.Instance(module, info) });
      },
    };
  },
  RuntimeError: Error,
  isWasm2js: true,
};
if (WebAssembly.isWasm2js) {
  wasmBinary = [];
}
var ABORT = false;
var isFileURI = (filename) => filename.startsWith("file://");
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
var runtimeInitialized = false;
function updateMemoryViews() {
  var b = wasmMemory.buffer;
  HEAP8 = new Int8Array(b);
  HEAP16 = new Int16Array(b);
  HEAPU8 = new Uint8Array(b);
  HEAPU16 = new Uint16Array(b);
  HEAP32 = new Int32Array(b);
  HEAPU32 = new Uint32Array(b);
  HEAPF32 = new Float32Array(b);
  HEAPF64 = new Float64Array(b);
}
function preRun() {
  if (Module["preRun"]) {
    if (typeof Module["preRun"] == "function")
      Module["preRun"] = [Module["preRun"]];
    while (Module["preRun"].length) {
      addOnPreRun(Module["preRun"].shift());
    }
  }
  callRuntimeCallbacks(onPreRuns);
}
function initRuntime() {
  runtimeInitialized = true;
  if (!Module["noFSInit"] && !FS.initialized) FS.init();
  TTY.init();
  wasmExports["n"]();
  FS.ignorePermissions = false;
}
function postRun() {
  if (Module["postRun"]) {
    if (typeof Module["postRun"] == "function")
      Module["postRun"] = [Module["postRun"]];
    while (Module["postRun"].length) {
      addOnPostRun(Module["postRun"].shift());
    }
  }
  callRuntimeCallbacks(onPostRuns);
}
function abort(what) {
  Module["onAbort"]?.(what);
  what = "Aborted(" + what + ")";
  err(what);
  ABORT = true;
  what += ". Build with -sASSERTIONS for more info.";
  var e = new WebAssembly.RuntimeError(what);
  throw e;
}
var wasmBinaryFile;
function findWasmBinary(file) {}
function getWasmBinary(file) {}
async function instantiateArrayBuffer(binaryFile, imports) {
  try {
    var binary = await getWasmBinary(binaryFile);
    var instance = await WebAssembly.instantiate(binary, imports);
    return instance;
  } catch (reason) {
    err(`failed to asynchronously prepare wasm: ${reason}`);
    abort(reason);
  }
}
async function instantiateAsync(binary, binaryFile, imports) {
  if (!binary && !isFileURI(binaryFile) && !ENVIRONMENT_IS_NODE) {
    try {
      var response = fetch(binaryFile, { credentials: "same-origin" });
      var instantiationResult = await WebAssembly.instantiateStreaming(
        response,
        imports,
      );
      return instantiationResult;
    } catch (reason) {
      err(`wasm streaming compile failed: ${reason}`);
      err("falling back to ArrayBuffer instantiation");
    }
  }
  return instantiateArrayBuffer(binaryFile, imports);
}
function getWasmImports() {
  var imports = { a: wasmImports };
  return imports;
}
async function createWasm() {
  function receiveInstance(instance, module) {
    wasmExports = instance.exports;
    assignWasmExports(wasmExports);
    updateMemoryViews();
    removeRunDependency("wasm-instantiate");
    return wasmExports;
  }
  addRunDependency("wasm-instantiate");
  function receiveInstantiationResult(result) {
    return receiveInstance(result["instance"]);
  }
  var info = getWasmImports();
  if (Module["instantiateWasm"]) {
    return new Promise((resolve, reject) => {
      Module["instantiateWasm"](info, (inst, mod) => {
        resolve(receiveInstance(inst, mod));
      });
    });
  }
  wasmBinaryFile ??= findWasmBinary();
  var result = await instantiateAsync(wasmBinary, wasmBinaryFile, info);
  var exports = receiveInstantiationResult(result);
  return exports;
}
var tempDouble;
var tempI64;
class ExitStatus {
  name = "ExitStatus";
  constructor(status) {
    this.message = `Program terminated with exit(${status})`;
    this.status = status;
  }
}
var callRuntimeCallbacks = (callbacks) => {
  while (callbacks.length > 0) {
    callbacks.shift()(Module);
  }
};
var onPostRuns = [];
var addOnPostRun = (cb) => onPostRuns.push(cb);
var onPreRuns = [];
var addOnPreRun = (cb) => onPreRuns.push(cb);
var runDependencies = 0;
var dependenciesFulfilled = null;
var removeRunDependency = (id) => {
  runDependencies--;
  Module["monitorRunDependencies"]?.(runDependencies);
  if (runDependencies == 0) {
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback();
    }
  }
};
var addRunDependency = (id) => {
  runDependencies++;
  Module["monitorRunDependencies"]?.(runDependencies);
};
function getValue(ptr, type = "i8") {
  if (type.endsWith("*")) type = "*";
  switch (type) {
    case "i1":
      return HEAP8[ptr];
    case "i8":
      return HEAP8[ptr];
    case "i16":
      return HEAP16[ptr >> 1];
    case "i32":
      return HEAP32[ptr >> 2];
    case "i64":
      abort("to do getValue(i64) use WASM_BIGINT");
    case "float":
      return HEAPF32[ptr >> 2];
    case "double":
      return HEAPF64[ptr >> 3];
    case "*":
      return HEAPU32[ptr >> 2];
    default:
      abort(`invalid type for getValue: ${type}`);
  }
}
var noExitRuntime = true;
var UTF8Decoder = new TextDecoder();
var findStringEnd = (heapOrArray, idx, maxBytesToRead, ignoreNul) => {
  var maxIdx = idx + maxBytesToRead;
  if (ignoreNul) return maxIdx;
  while (heapOrArray[idx] && !(idx >= maxIdx)) ++idx;
  return idx;
};
var UTF8ToString = (ptr, maxBytesToRead, ignoreNul) => {
  if (!ptr) return "";
  var end = findStringEnd(HEAPU8, ptr, maxBytesToRead, ignoreNul);
  return UTF8Decoder.decode(HEAPU8.subarray(ptr, end));
};
var ___assert_fail = (condition, filename, line, func) =>
  abort(
    `Assertion failed: ${UTF8ToString(condition)}, at: ` +
      [
        filename ? UTF8ToString(filename) : "unknown filename",
        line,
        func ? UTF8ToString(func) : "unknown function",
      ],
  );
class ExceptionInfo {
  constructor(excPtr) {
    this.excPtr = excPtr;
    this.ptr = excPtr - 24;
  }
  set_type(type) {
    HEAPU32[(this.ptr + 4) >> 2] = type;
  }
  get_type() {
    return HEAPU32[(this.ptr + 4) >> 2];
  }
  set_destructor(destructor) {
    HEAPU32[(this.ptr + 8) >> 2] = destructor;
  }
  get_destructor() {
    return HEAPU32[(this.ptr + 8) >> 2];
  }
  set_caught(caught) {
    caught = caught ? 1 : 0;
    HEAP8[this.ptr + 12] = caught;
  }
  get_caught() {
    return HEAP8[this.ptr + 12] != 0;
  }
  set_rethrown(rethrown) {
    rethrown = rethrown ? 1 : 0;
    HEAP8[this.ptr + 13] = rethrown;
  }
  get_rethrown() {
    return HEAP8[this.ptr + 13] != 0;
  }
  init(type, destructor) {
    this.set_adjusted_ptr(0);
    this.set_type(type);
    this.set_destructor(destructor);
  }
  set_adjusted_ptr(adjustedPtr) {
    HEAPU32[(this.ptr + 16) >> 2] = adjustedPtr;
  }
  get_adjusted_ptr() {
    return HEAPU32[(this.ptr + 16) >> 2];
  }
}
var syscallGetVarargI = () => {
  var ret = HEAP32[+SYSCALLS.varargs >> 2];
  SYSCALLS.varargs += 4;
  return ret;
};
var syscallGetVarargP = syscallGetVarargI;
var PATH = {
  isAbs: (path) => path.charAt(0) === "/",
  splitPath: (filename) => {
    var splitPathRe =
      /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
    return splitPathRe.exec(filename).slice(1);
  },
  normalizeArray: (parts, allowAboveRoot) => {
    var up = 0;
    for (var i = parts.length - 1; i >= 0; i--) {
      var last = parts[i];
      if (last === ".") {
        parts.splice(i, 1);
      } else if (last === "..") {
        parts.splice(i, 1);
        up++;
      } else if (up) {
        parts.splice(i, 1);
        up--;
      }
    }
    if (allowAboveRoot) {
      for (; up; up--) {
        parts.unshift("..");
      }
    }
    return parts;
  },
  normalize: (path) => {
    var isAbsolute = PATH.isAbs(path),
      trailingSlash = path.slice(-1) === "/";
    path = PATH.normalizeArray(
      path.split("/").filter((p) => !!p),
      !isAbsolute,
    ).join("/");
    if (!path && !isAbsolute) {
      path = ".";
    }
    if (path && trailingSlash) {
      path += "/";
    }
    return (isAbsolute ? "/" : "") + path;
  },
  dirname: (path) => {
    var result = PATH.splitPath(path),
      root = result[0],
      dir = result[1];
    if (!root && !dir) {
      return ".";
    }
    if (dir) {
      dir = dir.slice(0, -1);
    }
    return root + dir;
  },
  basename: (path) => path && path.match(/([^\/]+|\/)\/*$/)[1],
  join: (...paths) => PATH.normalize(paths.join("/")),
  join2: (l, r) => PATH.normalize(l + "/" + r),
};
var initRandomFill = () => {
  if (ENVIRONMENT_IS_NODE) {
    var nodeCrypto = require("node:crypto");
    return (view) => nodeCrypto.randomFillSync(view);
  }
  return (view) => crypto.getRandomValues(view);
};
var randomFill = (view) => {
  (randomFill = initRandomFill())(view);
};
var PATH_FS = {
  resolve: (...args) => {
    var resolvedPath = "",
      resolvedAbsolute = false;
    for (var i = args.length - 1; i >= -1 && !resolvedAbsolute; i--) {
      var path = i >= 0 ? args[i] : FS.cwd();
      if (typeof path != "string") {
        throw new TypeError("Arguments to path.resolve must be strings");
      } else if (!path) {
        return "";
      }
      resolvedPath = path + "/" + resolvedPath;
      resolvedAbsolute = PATH.isAbs(path);
    }
    resolvedPath = PATH.normalizeArray(
      resolvedPath.split("/").filter((p) => !!p),
      !resolvedAbsolute,
    ).join("/");
    return (resolvedAbsolute ? "/" : "") + resolvedPath || ".";
  },
  relative: (from, to) => {
    from = PATH_FS.resolve(from).slice(1);
    to = PATH_FS.resolve(to).slice(1);
    function trim(arr) {
      var start = 0;
      for (; start < arr.length; start++) {
        if (arr[start] !== "") break;
      }
      var end = arr.length - 1;
      for (; end >= 0; end--) {
        if (arr[end] !== "") break;
      }
      if (start > end) return [];
      return arr.slice(start, end - start + 1);
    }
    var fromParts = trim(from.split("/"));
    var toParts = trim(to.split("/"));
    var length = Math.min(fromParts.length, toParts.length);
    var samePartsLength = length;
    for (var i = 0; i < length; i++) {
      if (fromParts[i] !== toParts[i]) {
        samePartsLength = i;
        break;
      }
    }
    var outputParts = [];
    for (var i = samePartsLength; i < fromParts.length; i++) {
      outputParts.push("..");
    }
    outputParts = outputParts.concat(toParts.slice(samePartsLength));
    return outputParts.join("/");
  },
};
var UTF8ArrayToString = (heapOrArray, idx = 0, maxBytesToRead, ignoreNul) => {
  var endPtr = findStringEnd(heapOrArray, idx, maxBytesToRead, ignoreNul);
  return UTF8Decoder.decode(
    heapOrArray.buffer
      ? heapOrArray.subarray(idx, endPtr)
      : new Uint8Array(heapOrArray.slice(idx, endPtr)),
  );
};
var FS_stdin_getChar_buffer = [];
var lengthBytesUTF8 = (str) => {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    var c = str.charCodeAt(i);
    if (c <= 127) {
      len++;
    } else if (c <= 2047) {
      len += 2;
    } else if (c >= 55296 && c <= 57343) {
      len += 4;
      ++i;
    } else {
      len += 3;
    }
  }
  return len;
};
var stringToUTF8Array = (str, heap, outIdx, maxBytesToWrite) => {
  if (!(maxBytesToWrite > 0)) return 0;
  var startIdx = outIdx;
  var endIdx = outIdx + maxBytesToWrite - 1;
  for (var i = 0; i < str.length; ++i) {
    var u = str.codePointAt(i);
    if (u <= 127) {
      if (outIdx >= endIdx) break;
      heap[outIdx++] = u;
    } else if (u <= 2047) {
      if (outIdx + 1 >= endIdx) break;
      heap[outIdx++] = 192 | (u >> 6);
      heap[outIdx++] = 128 | (u & 63);
    } else if (u <= 65535) {
      if (outIdx + 2 >= endIdx) break;
      heap[outIdx++] = 224 | (u >> 12);
      heap[outIdx++] = 128 | ((u >> 6) & 63);
      heap[outIdx++] = 128 | (u & 63);
    } else {
      if (outIdx + 3 >= endIdx) break;
      heap[outIdx++] = 240 | (u >> 18);
      heap[outIdx++] = 128 | ((u >> 12) & 63);
      heap[outIdx++] = 128 | ((u >> 6) & 63);
      heap[outIdx++] = 128 | (u & 63);
      i++;
    }
  }
  heap[outIdx] = 0;
  return outIdx - startIdx;
};
var intArrayFromString = (stringy, dontAddNull, length) => {
  var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
  var u8array = new Array(len);
  var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
  if (dontAddNull) u8array.length = numBytesWritten;
  return u8array;
};
var FS_stdin_getChar = () => {
  if (!FS_stdin_getChar_buffer.length) {
    var result = null;
    if (ENVIRONMENT_IS_NODE) {
      var BUFSIZE = 256;
      var buf = Buffer.alloc(BUFSIZE);
      var bytesRead = 0;
      var fd = process.stdin.fd;
      try {
        bytesRead = fs.readSync(fd, buf, 0, BUFSIZE);
      } catch (e) {
        if (e.toString().includes("EOF")) bytesRead = 0;
        else throw e;
      }
      if (bytesRead > 0) {
        result = buf.slice(0, bytesRead).toString("utf-8");
      }
    } else if (globalThis.window?.prompt) {
      result = window.prompt("Input: ");
      if (result !== null) {
        result += "\n";
      }
    } else {
    }
    if (!result) {
      return null;
    }
    FS_stdin_getChar_buffer = intArrayFromString(result, true);
  }
  return FS_stdin_getChar_buffer.shift();
};
var TTY = {
  ttys: [],
  init() {},
  shutdown() {},
  register(dev, ops) {
    TTY.ttys[dev] = { input: [], output: [], ops };
    FS.registerDevice(dev, TTY.stream_ops);
  },
  stream_ops: {
    open(stream) {
      var tty = TTY.ttys[stream.node.rdev];
      if (!tty) {
        throw new FS.ErrnoError(43);
      }
      stream.tty = tty;
      stream.seekable = false;
    },
    close(stream) {
      stream.tty.ops.fsync(stream.tty);
    },
    fsync(stream) {
      stream.tty.ops.fsync(stream.tty);
    },
    read(stream, buffer, offset, length, pos) {
      if (!stream.tty || !stream.tty.ops.get_char) {
        throw new FS.ErrnoError(60);
      }
      var bytesRead = 0;
      for (var i = 0; i < length; i++) {
        var result;
        try {
          result = stream.tty.ops.get_char(stream.tty);
        } catch (e) {
          throw new FS.ErrnoError(29);
        }
        if (result === undefined && bytesRead === 0) {
          throw new FS.ErrnoError(6);
        }
        if (result === null || result === undefined) break;
        bytesRead++;
        buffer[offset + i] = result;
      }
      if (bytesRead) {
        stream.node.atime = Date.now();
      }
      return bytesRead;
    },
    write(stream, buffer, offset, length, pos) {
      if (!stream.tty || !stream.tty.ops.put_char) {
        throw new FS.ErrnoError(60);
      }
      try {
        for (var i = 0; i < length; i++) {
          stream.tty.ops.put_char(stream.tty, buffer[offset + i]);
        }
      } catch (e) {
        throw new FS.ErrnoError(29);
      }
      if (length) {
        stream.node.mtime = stream.node.ctime = Date.now();
      }
      return i;
    },
  },
  default_tty_ops: {
    get_char(tty) {
      return FS_stdin_getChar();
    },
    put_char(tty, val) {
      if (val === null || val === 10) {
        out(UTF8ArrayToString(tty.output));
        tty.output = [];
      } else {
        if (val != 0) tty.output.push(val);
      }
    },
    fsync(tty) {
      if (tty.output?.length > 0) {
        out(UTF8ArrayToString(tty.output));
        tty.output = [];
      }
    },
    ioctl_tcgets(tty) {
      return {
        c_iflag: 25856,
        c_oflag: 5,
        c_cflag: 191,
        c_lflag: 35387,
        c_cc: [
          3, 28, 127, 21, 4, 0, 1, 0, 17, 19, 26, 0, 18, 15, 23, 22, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        ],
      };
    },
    ioctl_tcsets(tty, optional_actions, data) {
      return 0;
    },
    ioctl_tiocgwinsz(tty) {
      return [24, 80];
    },
  },
  default_tty1_ops: {
    put_char(tty, val) {
      if (val === null || val === 10) {
        err(UTF8ArrayToString(tty.output));
        tty.output = [];
      } else {
        if (val != 0) tty.output.push(val);
      }
    },
    fsync(tty) {
      if (tty.output?.length > 0) {
        err(UTF8ArrayToString(tty.output));
        tty.output = [];
      }
    },
  },
};
var mmapAlloc = (size) => {
  abort();
};
var MEMFS = {
  ops_table: null,
  mount(mount) {
    return MEMFS.createNode(null, "/", 16895, 0);
  },
  createNode(parent, name, mode, dev) {
    if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
      throw new FS.ErrnoError(63);
    }
    MEMFS.ops_table ||= {
      dir: {
        node: {
          getattr: MEMFS.node_ops.getattr,
          setattr: MEMFS.node_ops.setattr,
          lookup: MEMFS.node_ops.lookup,
          mknod: MEMFS.node_ops.mknod,
          rename: MEMFS.node_ops.rename,
          unlink: MEMFS.node_ops.unlink,
          rmdir: MEMFS.node_ops.rmdir,
          readdir: MEMFS.node_ops.readdir,
          symlink: MEMFS.node_ops.symlink,
        },
        stream: { llseek: MEMFS.stream_ops.llseek },
      },
      file: {
        node: {
          getattr: MEMFS.node_ops.getattr,
          setattr: MEMFS.node_ops.setattr,
        },
        stream: {
          llseek: MEMFS.stream_ops.llseek,
          read: MEMFS.stream_ops.read,
          write: MEMFS.stream_ops.write,
          mmap: MEMFS.stream_ops.mmap,
          msync: MEMFS.stream_ops.msync,
        },
      },
      link: {
        node: {
          getattr: MEMFS.node_ops.getattr,
          setattr: MEMFS.node_ops.setattr,
          readlink: MEMFS.node_ops.readlink,
        },
        stream: {},
      },
      chrdev: {
        node: {
          getattr: MEMFS.node_ops.getattr,
          setattr: MEMFS.node_ops.setattr,
        },
        stream: FS.chrdev_stream_ops,
      },
    };
    var node = FS.createNode(parent, name, mode, dev);
    if (FS.isDir(node.mode)) {
      node.node_ops = MEMFS.ops_table.dir.node;
      node.stream_ops = MEMFS.ops_table.dir.stream;
      node.contents = {};
    } else if (FS.isFile(node.mode)) {
      node.node_ops = MEMFS.ops_table.file.node;
      node.stream_ops = MEMFS.ops_table.file.stream;
      node.usedBytes = 0;
      node.contents = MEMFS.emptyFileContents ??= new Uint8Array(0);
    } else if (FS.isLink(node.mode)) {
      node.node_ops = MEMFS.ops_table.link.node;
      node.stream_ops = MEMFS.ops_table.link.stream;
    } else if (FS.isChrdev(node.mode)) {
      node.node_ops = MEMFS.ops_table.chrdev.node;
      node.stream_ops = MEMFS.ops_table.chrdev.stream;
    }
    node.atime = node.mtime = node.ctime = Date.now();
    if (parent) {
      parent.contents[name] = node;
      parent.atime = parent.mtime = parent.ctime = node.atime;
    }
    return node;
  },
  getFileDataAsTypedArray(node) {
    return node.contents.subarray(0, node.usedBytes);
  },
  expandFileStorage(node, newCapacity) {
    var prevCapacity = node.contents.length;
    if (prevCapacity >= newCapacity) return;
    var CAPACITY_DOUBLING_MAX = 1024 * 1024;
    newCapacity = Math.max(
      newCapacity,
      (prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2 : 1.125)) >>> 0,
    );
    if (prevCapacity) newCapacity = Math.max(newCapacity, 256);
    var oldContents = MEMFS.getFileDataAsTypedArray(node);
    node.contents = new Uint8Array(newCapacity);
    node.contents.set(oldContents);
  },
  resizeFileStorage(node, newSize) {
    if (node.usedBytes == newSize) return;
    var oldContents = node.contents;
    node.contents = new Uint8Array(newSize);
    node.contents.set(
      oldContents.subarray(0, Math.min(newSize, node.usedBytes)),
    );
    node.usedBytes = newSize;
  },
  node_ops: {
    getattr(node) {
      var attr = {};
      attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
      attr.ino = node.id;
      attr.mode = node.mode;
      attr.nlink = 1;
      attr.uid = 0;
      attr.gid = 0;
      attr.rdev = node.rdev;
      if (FS.isDir(node.mode)) {
        attr.size = 4096;
      } else if (FS.isFile(node.mode)) {
        attr.size = node.usedBytes;
      } else if (FS.isLink(node.mode)) {
        attr.size = node.link.length;
      } else {
        attr.size = 0;
      }
      attr.atime = new Date(node.atime);
      attr.mtime = new Date(node.mtime);
      attr.ctime = new Date(node.ctime);
      attr.blksize = 4096;
      attr.blocks = Math.ceil(attr.size / attr.blksize);
      return attr;
    },
    setattr(node, attr) {
      for (const key of ["mode", "atime", "mtime", "ctime"]) {
        if (attr[key] != null) {
          node[key] = attr[key];
        }
      }
      if (attr.size !== undefined) {
        MEMFS.resizeFileStorage(node, attr.size);
      }
    },
    lookup(parent, name) {
      if (!MEMFS.doesNotExistError) {
        MEMFS.doesNotExistError = new FS.ErrnoError(44);
        MEMFS.doesNotExistError.stack = "<generic error, no stack>";
      }
      throw MEMFS.doesNotExistError;
    },
    mknod(parent, name, mode, dev) {
      return MEMFS.createNode(parent, name, mode, dev);
    },
    rename(old_node, new_dir, new_name) {
      var new_node;
      try {
        new_node = FS.lookupNode(new_dir, new_name);
      } catch (e) {}
      if (new_node) {
        if (FS.isDir(old_node.mode)) {
          for (var i in new_node.contents) {
            throw new FS.ErrnoError(55);
          }
        }
        FS.hashRemoveNode(new_node);
      }
      delete old_node.parent.contents[old_node.name];
      new_dir.contents[new_name] = old_node;
      old_node.name = new_name;
      new_dir.ctime =
        new_dir.mtime =
        old_node.parent.ctime =
        old_node.parent.mtime =
          Date.now();
    },
    unlink(parent, name) {
      delete parent.contents[name];
      parent.ctime = parent.mtime = Date.now();
    },
    rmdir(parent, name) {
      var node = FS.lookupNode(parent, name);
      for (var i in node.contents) {
        throw new FS.ErrnoError(55);
      }
      delete parent.contents[name];
      parent.ctime = parent.mtime = Date.now();
    },
    readdir(node) {
      return [".", "..", ...Object.keys(node.contents)];
    },
    symlink(parent, newname, oldpath) {
      var node = MEMFS.createNode(parent, newname, 511 | 40960, 0);
      node.link = oldpath;
      return node;
    },
    readlink(node) {
      if (!FS.isLink(node.mode)) {
        throw new FS.ErrnoError(28);
      }
      return node.link;
    },
  },
  stream_ops: {
    read(stream, buffer, offset, length, position) {
      var contents = stream.node.contents;
      if (position >= stream.node.usedBytes) return 0;
      var size = Math.min(stream.node.usedBytes - position, length);
      buffer.set(contents.subarray(position, position + size), offset);
      return size;
    },
    write(stream, buffer, offset, length, position, canOwn) {
      if (buffer.buffer === HEAP8.buffer) {
        canOwn = false;
      }
      if (!length) return 0;
      var node = stream.node;
      node.mtime = node.ctime = Date.now();
      if (canOwn) {
        node.contents = buffer.subarray(offset, offset + length);
        node.usedBytes = length;
      } else if (node.usedBytes === 0 && position === 0) {
        node.contents = buffer.slice(offset, offset + length);
        node.usedBytes = length;
      } else {
        MEMFS.expandFileStorage(node, position + length);
        node.contents.set(buffer.subarray(offset, offset + length), position);
        node.usedBytes = Math.max(node.usedBytes, position + length);
      }
      return length;
    },
    llseek(stream, offset, whence) {
      var position = offset;
      if (whence === 1) {
        position += stream.position;
      } else if (whence === 2) {
        if (FS.isFile(stream.node.mode)) {
          position += stream.node.usedBytes;
        }
      }
      if (position < 0) {
        throw new FS.ErrnoError(28);
      }
      return position;
    },
    mmap(stream, length, position, prot, flags) {
      if (!FS.isFile(stream.node.mode)) {
        throw new FS.ErrnoError(43);
      }
      var ptr;
      var allocated;
      var contents = stream.node.contents;
      if (!(flags & 2) && contents.buffer === HEAP8.buffer) {
        allocated = false;
        ptr = contents.byteOffset;
      } else {
        allocated = true;
        ptr = mmapAlloc(length);
        if (!ptr) {
          throw new FS.ErrnoError(48);
        }
        if (contents) {
          if (position > 0 || position + length < contents.length) {
            if (contents.subarray) {
              contents = contents.subarray(position, position + length);
            } else {
              contents = Array.prototype.slice.call(
                contents,
                position,
                position + length,
              );
            }
          }
          HEAP8.set(contents, ptr);
        }
      }
      return { ptr, allocated };
    },
    msync(stream, buffer, offset, length, mmapFlags) {
      MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
      return 0;
    },
  },
};
var FS_modeStringToFlags = (str) => {
  if (typeof str != "string") return str;
  var flagModes = {
    r: 0,
    "r+": 2,
    w: 512 | 64 | 1,
    "w+": 512 | 64 | 2,
    a: 1024 | 64 | 1,
    "a+": 1024 | 64 | 2,
  };
  var flags = flagModes[str];
  if (typeof flags == "undefined") {
    throw new Error(`Unknown file open mode: ${str}`);
  }
  return flags;
};
var FS_fileDataToTypedArray = (data) => {
  if (typeof data == "string") {
    data = intArrayFromString(data, true);
  }
  if (!data.subarray) {
    data = new Uint8Array(data);
  }
  return data;
};
var FS_getMode = (canRead, canWrite) => {
  var mode = 0;
  if (canRead) mode |= 292 | 73;
  if (canWrite) mode |= 146;
  return mode;
};
var asyncLoad = async (url) => {
  var arrayBuffer = await readAsync(url);
  return new Uint8Array(arrayBuffer);
};
var FS_createDataFile = (...args) => FS.createDataFile(...args);
var getUniqueRunDependency = (id) => id;
var preloadPlugins = [];
var FS_handledByPreloadPlugin = async (byteArray, fullname) => {
  if (typeof Browser != "undefined") Browser.init();
  for (var plugin of preloadPlugins) {
    if (plugin["canHandle"](fullname)) {
      return plugin["handle"](byteArray, fullname);
    }
  }
  return byteArray;
};
var FS_preloadFile = async (
  parent,
  name,
  url,
  canRead,
  canWrite,
  dontCreateFile,
  canOwn,
  preFinish,
) => {
  var fullname = name ? PATH_FS.resolve(PATH.join2(parent, name)) : parent;
  var dep = getUniqueRunDependency(`cp ${fullname}`);
  addRunDependency(dep);
  try {
    var byteArray = url;
    if (typeof url == "string") {
      byteArray = await asyncLoad(url);
    }
    byteArray = await FS_handledByPreloadPlugin(byteArray, fullname);
    preFinish?.();
    if (!dontCreateFile) {
      FS_createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
    }
  } finally {
    removeRunDependency(dep);
  }
};
var FS_createPreloadedFile = (
  parent,
  name,
  url,
  canRead,
  canWrite,
  onload,
  onerror,
  dontCreateFile,
  canOwn,
  preFinish,
) => {
  FS_preloadFile(
    parent,
    name,
    url,
    canRead,
    canWrite,
    dontCreateFile,
    canOwn,
    preFinish,
  )
    .then(onload)
    .catch(onerror);
};
var FS = {
  root: null,
  mounts: [],
  devices: {},
  streams: [],
  nextInode: 1,
  nameTable: null,
  currentPath: "/",
  initialized: false,
  ignorePermissions: true,
  filesystems: null,
  syncFSRequests: 0,
  ErrnoError: class {
    name = "ErrnoError";
    constructor(errno) {
      this.errno = errno;
    }
  },
  FSStream: class {
    shared = {};
    get object() {
      return this.node;
    }
    set object(val) {
      this.node = val;
    }
    get isRead() {
      return (this.flags & 2097155) !== 1;
    }
    get isWrite() {
      return (this.flags & 2097155) !== 0;
    }
    get isAppend() {
      return this.flags & 1024;
    }
    get flags() {
      return this.shared.flags;
    }
    set flags(val) {
      this.shared.flags = val;
    }
    get position() {
      return this.shared.position;
    }
    set position(val) {
      this.shared.position = val;
    }
  },
  FSNode: class {
    node_ops = {};
    stream_ops = {};
    readMode = 292 | 73;
    writeMode = 146;
    mounted = null;
    constructor(parent, name, mode, rdev) {
      if (!parent) {
        parent = this;
      }
      this.parent = parent;
      this.mount = parent.mount;
      this.id = FS.nextInode++;
      this.name = name;
      this.mode = mode;
      this.rdev = rdev;
      this.atime = this.mtime = this.ctime = Date.now();
    }
    get read() {
      return (this.mode & this.readMode) === this.readMode;
    }
    set read(val) {
      val ? (this.mode |= this.readMode) : (this.mode &= ~this.readMode);
    }
    get write() {
      return (this.mode & this.writeMode) === this.writeMode;
    }
    set write(val) {
      val ? (this.mode |= this.writeMode) : (this.mode &= ~this.writeMode);
    }
    get isFolder() {
      return FS.isDir(this.mode);
    }
    get isDevice() {
      return FS.isChrdev(this.mode);
    }
  },
  lookupPath(path, opts = {}) {
    if (!path) {
      throw new FS.ErrnoError(44);
    }
    opts.follow_mount ??= true;
    if (!PATH.isAbs(path)) {
      path = FS.cwd() + "/" + path;
    }
    linkloop: for (var nlinks = 0; nlinks < 40; nlinks++) {
      var parts = path.split("/").filter((p) => !!p);
      var current = FS.root;
      var current_path = "/";
      for (var i = 0; i < parts.length; i++) {
        var islast = i === parts.length - 1;
        if (islast && opts.parent) {
          break;
        }
        if (parts[i] === ".") {
          continue;
        }
        if (parts[i] === "..") {
          current_path = PATH.dirname(current_path);
          if (FS.isRoot(current)) {
            path = current_path + "/" + parts.slice(i + 1).join("/");
            nlinks--;
            continue linkloop;
          } else {
            current = current.parent;
          }
          continue;
        }
        current_path = PATH.join2(current_path, parts[i]);
        try {
          current = FS.lookupNode(current, parts[i]);
        } catch (e) {
          if (e?.errno === 44 && islast && opts.noent_okay) {
            return { path: current_path };
          }
          throw e;
        }
        if (FS.isMountpoint(current) && (!islast || opts.follow_mount)) {
          current = current.mounted.root;
        }
        if (FS.isLink(current.mode) && (!islast || opts.follow)) {
          if (!current.node_ops.readlink) {
            throw new FS.ErrnoError(52);
          }
          var link = current.node_ops.readlink(current);
          if (!PATH.isAbs(link)) {
            link = PATH.dirname(current_path) + "/" + link;
          }
          path = link + "/" + parts.slice(i + 1).join("/");
          continue linkloop;
        }
      }
      return { path: current_path, node: current };
    }
    throw new FS.ErrnoError(32);
  },
  getPath(node) {
    var path;
    while (true) {
      if (FS.isRoot(node)) {
        var mount = node.mount.mountpoint;
        if (!path) return mount;
        return mount[mount.length - 1] !== "/"
          ? `${mount}/${path}`
          : mount + path;
      }
      path = path ? `${node.name}/${path}` : node.name;
      node = node.parent;
    }
  },
  hashName(parentid, name) {
    var hash = 0;
    for (var i = 0; i < name.length; i++) {
      hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
    }
    return ((parentid + hash) >>> 0) % FS.nameTable.length;
  },
  hashAddNode(node) {
    var hash = FS.hashName(node.parent.id, node.name);
    node.name_next = FS.nameTable[hash];
    FS.nameTable[hash] = node;
  },
  hashRemoveNode(node) {
    var hash = FS.hashName(node.parent.id, node.name);
    if (FS.nameTable[hash] === node) {
      FS.nameTable[hash] = node.name_next;
    } else {
      var current = FS.nameTable[hash];
      while (current) {
        if (current.name_next === node) {
          current.name_next = node.name_next;
          break;
        }
        current = current.name_next;
      }
    }
  },
  lookupNode(parent, name) {
    var errCode = FS.mayLookup(parent);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    var hash = FS.hashName(parent.id, name);
    for (var node = FS.nameTable[hash]; node; node = node.name_next) {
      var nodeName = node.name;
      if (node.parent.id === parent.id && nodeName === name) {
        return node;
      }
    }
    return FS.lookup(parent, name);
  },
  createNode(parent, name, mode, rdev) {
    var node = new FS.FSNode(parent, name, mode, rdev);
    FS.hashAddNode(node);
    return node;
  },
  destroyNode(node) {
    FS.hashRemoveNode(node);
  },
  isRoot(node) {
    return node === node.parent;
  },
  isMountpoint(node) {
    return !!node.mounted;
  },
  isFile(mode) {
    return (mode & 61440) === 32768;
  },
  isDir(mode) {
    return (mode & 61440) === 16384;
  },
  isLink(mode) {
    return (mode & 61440) === 40960;
  },
  isChrdev(mode) {
    return (mode & 61440) === 8192;
  },
  isBlkdev(mode) {
    return (mode & 61440) === 24576;
  },
  isFIFO(mode) {
    return (mode & 61440) === 4096;
  },
  isSocket(mode) {
    return (mode & 49152) === 49152;
  },
  flagsToPermissionString(flag) {
    var perms = ["r", "w", "rw"][flag & 3];
    if (flag & 512) {
      perms += "w";
    }
    return perms;
  },
  nodePermissions(node, perms) {
    if (FS.ignorePermissions) {
      return 0;
    }
    if (perms.includes("r") && !(node.mode & 292)) {
      return 2;
    }
    if (perms.includes("w") && !(node.mode & 146)) {
      return 2;
    }
    if (perms.includes("x") && !(node.mode & 73)) {
      return 2;
    }
    return 0;
  },
  mayLookup(dir) {
    if (!FS.isDir(dir.mode)) return 54;
    var errCode = FS.nodePermissions(dir, "x");
    if (errCode) return errCode;
    if (!dir.node_ops.lookup) return 2;
    return 0;
  },
  mayCreate(dir, name) {
    if (!FS.isDir(dir.mode)) {
      return 54;
    }
    try {
      var node = FS.lookupNode(dir, name);
      return 20;
    } catch (e) {}
    return FS.nodePermissions(dir, "wx");
  },
  mayDelete(dir, name, isdir) {
    var node;
    try {
      node = FS.lookupNode(dir, name);
    } catch (e) {
      return e.errno;
    }
    var errCode = FS.nodePermissions(dir, "wx");
    if (errCode) {
      return errCode;
    }
    if (isdir) {
      if (!FS.isDir(node.mode)) {
        return 54;
      }
      if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
        return 10;
      }
    } else if (FS.isDir(node.mode)) {
      return 31;
    }
    return 0;
  },
  mayOpen(node, flags) {
    if (!node) {
      return 44;
    }
    if (FS.isLink(node.mode)) {
      return 32;
    }
    var mode = FS.flagsToPermissionString(flags);
    if (FS.isDir(node.mode)) {
      if (mode !== "r" || flags & (512 | 64)) {
        return 31;
      }
    }
    return FS.nodePermissions(node, mode);
  },
  checkOpExists(op, err) {
    if (!op) {
      throw new FS.ErrnoError(err);
    }
    return op;
  },
  MAX_OPEN_FDS: 4096,
  nextfd() {
    for (var fd = 0; fd <= FS.MAX_OPEN_FDS; fd++) {
      if (!FS.streams[fd]) {
        return fd;
      }
    }
    throw new FS.ErrnoError(33);
  },
  getStreamChecked(fd) {
    var stream = FS.getStream(fd);
    if (!stream) {
      throw new FS.ErrnoError(8);
    }
    return stream;
  },
  getStream: (fd) => FS.streams[fd],
  createStream(stream, fd = -1) {
    stream = Object.assign(new FS.FSStream(), stream);
    if (fd == -1) {
      fd = FS.nextfd();
    }
    stream.fd = fd;
    FS.streams[fd] = stream;
    return stream;
  },
  closeStream(fd) {
    FS.streams[fd] = null;
  },
  dupStream(origStream, fd = -1) {
    var stream = FS.createStream(origStream, fd);
    stream.stream_ops?.dup?.(stream);
    return stream;
  },
  doSetAttr(stream, node, attr) {
    var setattr = stream?.stream_ops.setattr;
    var arg = setattr ? stream : node;
    setattr ??= node.node_ops.setattr;
    FS.checkOpExists(setattr, 63);
    setattr(arg, attr);
  },
  chrdev_stream_ops: {
    open(stream) {
      var device = FS.getDevice(stream.node.rdev);
      stream.stream_ops = device.stream_ops;
      stream.stream_ops.open?.(stream);
    },
    llseek() {
      throw new FS.ErrnoError(70);
    },
  },
  major: (dev) => dev >> 8,
  minor: (dev) => dev & 255,
  makedev: (ma, mi) => (ma << 8) | mi,
  registerDevice(dev, ops) {
    FS.devices[dev] = { stream_ops: ops };
  },
  getDevice: (dev) => FS.devices[dev],
  getMounts(mount) {
    var mounts = [];
    var check = [mount];
    while (check.length) {
      var m = check.pop();
      mounts.push(m);
      check.push(...m.mounts);
    }
    return mounts;
  },
  syncfs(populate, callback) {
    if (typeof populate == "function") {
      callback = populate;
      populate = false;
    }
    FS.syncFSRequests++;
    if (FS.syncFSRequests > 1) {
      err(
        `warning: ${FS.syncFSRequests} FS.syncfs operations in flight at once, probably just doing extra work`,
      );
    }
    var mounts = FS.getMounts(FS.root.mount);
    var completed = 0;
    function doCallback(errCode) {
      FS.syncFSRequests--;
      return callback(errCode);
    }
    function done(errCode) {
      if (errCode) {
        if (!done.errored) {
          done.errored = true;
          return doCallback(errCode);
        }
        return;
      }
      if (++completed >= mounts.length) {
        doCallback(null);
      }
    }
    for (var mount of mounts) {
      if (mount.type.syncfs) {
        mount.type.syncfs(mount, populate, done);
      } else {
        done(null);
      }
    }
  },
  mount(type, opts, mountpoint) {
    var root = mountpoint === "/";
    var pseudo = !mountpoint;
    var node;
    if (root && FS.root) {
      throw new FS.ErrnoError(10);
    } else if (!root && !pseudo) {
      var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
      mountpoint = lookup.path;
      node = lookup.node;
      if (FS.isMountpoint(node)) {
        throw new FS.ErrnoError(10);
      }
      if (!FS.isDir(node.mode)) {
        throw new FS.ErrnoError(54);
      }
    }
    var mount = { type, opts, mountpoint, mounts: [] };
    var mountRoot = type.mount(mount);
    mountRoot.mount = mount;
    mount.root = mountRoot;
    if (root) {
      FS.root = mountRoot;
    } else if (node) {
      node.mounted = mount;
      if (node.mount) {
        node.mount.mounts.push(mount);
      }
    }
    return mountRoot;
  },
  unmount(mountpoint) {
    var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
    if (!FS.isMountpoint(lookup.node)) {
      throw new FS.ErrnoError(28);
    }
    var node = lookup.node;
    var mount = node.mounted;
    var mounts = FS.getMounts(mount);
    for (var [hash, current] of Object.entries(FS.nameTable)) {
      while (current) {
        var next = current.name_next;
        if (mounts.includes(current.mount)) {
          FS.destroyNode(current);
        }
        current = next;
      }
    }
    node.mounted = null;
    var idx = node.mount.mounts.indexOf(mount);
    node.mount.mounts.splice(idx, 1);
  },
  lookup(parent, name) {
    return parent.node_ops.lookup(parent, name);
  },
  mknod(path, mode, dev) {
    var lookup = FS.lookupPath(path, { parent: true });
    var parent = lookup.node;
    var name = PATH.basename(path);
    if (!name) {
      throw new FS.ErrnoError(28);
    }
    if (name === "." || name === "..") {
      throw new FS.ErrnoError(20);
    }
    var errCode = FS.mayCreate(parent, name);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    if (!parent.node_ops.mknod) {
      throw new FS.ErrnoError(63);
    }
    return parent.node_ops.mknod(parent, name, mode, dev);
  },
  statfs(path) {
    return FS.statfsNode(FS.lookupPath(path, { follow: true }).node);
  },
  statfsStream(stream) {
    return FS.statfsNode(stream.node);
  },
  statfsNode(node) {
    var rtn = {
      bsize: 4096,
      frsize: 4096,
      blocks: 1e6,
      bfree: 5e5,
      bavail: 5e5,
      files: FS.nextInode,
      ffree: FS.nextInode - 1,
      fsid: 42,
      flags: 2,
      namelen: 255,
    };
    if (node.node_ops.statfs) {
      Object.assign(rtn, node.node_ops.statfs(node.mount.opts.root));
    }
    return rtn;
  },
  create(path, mode = 438) {
    mode &= 4095;
    mode |= 32768;
    return FS.mknod(path, mode, 0);
  },
  mkdir(path, mode = 511) {
    mode &= 511 | 512;
    mode |= 16384;
    return FS.mknod(path, mode, 0);
  },
  mkdirTree(path, mode) {
    var dirs = path.split("/");
    var d = "";
    for (var dir of dirs) {
      if (!dir) continue;
      if (d || PATH.isAbs(path)) d += "/";
      d += dir;
      try {
        FS.mkdir(d, mode);
      } catch (e) {
        if (e.errno != 20) throw e;
      }
    }
  },
  mkdev(path, mode, dev) {
    if (typeof dev == "undefined") {
      dev = mode;
      mode = 438;
    }
    mode |= 8192;
    return FS.mknod(path, mode, dev);
  },
  symlink(oldpath, newpath) {
    if (!PATH_FS.resolve(oldpath)) {
      throw new FS.ErrnoError(44);
    }
    var lookup = FS.lookupPath(newpath, { parent: true });
    var parent = lookup.node;
    if (!parent) {
      throw new FS.ErrnoError(44);
    }
    var newname = PATH.basename(newpath);
    var errCode = FS.mayCreate(parent, newname);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    if (!parent.node_ops.symlink) {
      throw new FS.ErrnoError(63);
    }
    return parent.node_ops.symlink(parent, newname, oldpath);
  },
  rename(old_path, new_path) {
    var old_dirname = PATH.dirname(old_path);
    var new_dirname = PATH.dirname(new_path);
    var old_name = PATH.basename(old_path);
    var new_name = PATH.basename(new_path);
    var lookup, old_dir, new_dir;
    lookup = FS.lookupPath(old_path, { parent: true });
    old_dir = lookup.node;
    lookup = FS.lookupPath(new_path, { parent: true });
    new_dir = lookup.node;
    if (!old_dir || !new_dir) throw new FS.ErrnoError(44);
    if (old_dir.mount !== new_dir.mount) {
      throw new FS.ErrnoError(75);
    }
    var old_node = FS.lookupNode(old_dir, old_name);
    var relative = PATH_FS.relative(old_path, new_dirname);
    if (relative.charAt(0) !== ".") {
      throw new FS.ErrnoError(28);
    }
    relative = PATH_FS.relative(new_path, old_dirname);
    if (relative.charAt(0) !== ".") {
      throw new FS.ErrnoError(55);
    }
    var new_node;
    try {
      new_node = FS.lookupNode(new_dir, new_name);
    } catch (e) {}
    if (old_node === new_node) {
      return;
    }
    var isdir = FS.isDir(old_node.mode);
    var errCode = FS.mayDelete(old_dir, old_name, isdir);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    errCode = new_node
      ? FS.mayDelete(new_dir, new_name, isdir)
      : FS.mayCreate(new_dir, new_name);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    if (!old_dir.node_ops.rename) {
      throw new FS.ErrnoError(63);
    }
    if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
      throw new FS.ErrnoError(10);
    }
    if (new_dir !== old_dir) {
      errCode = FS.nodePermissions(old_dir, "w");
      if (errCode) {
        throw new FS.ErrnoError(errCode);
      }
    }
    FS.hashRemoveNode(old_node);
    try {
      old_dir.node_ops.rename(old_node, new_dir, new_name);
      old_node.parent = new_dir;
    } catch (e) {
      throw e;
    } finally {
      FS.hashAddNode(old_node);
    }
  },
  rmdir(path) {
    var lookup = FS.lookupPath(path, { parent: true });
    var parent = lookup.node;
    var name = PATH.basename(path);
    var node = FS.lookupNode(parent, name);
    var errCode = FS.mayDelete(parent, name, true);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    if (!parent.node_ops.rmdir) {
      throw new FS.ErrnoError(63);
    }
    if (FS.isMountpoint(node)) {
      throw new FS.ErrnoError(10);
    }
    parent.node_ops.rmdir(parent, name);
    FS.destroyNode(node);
  },
  readdir(path) {
    var lookup = FS.lookupPath(path, { follow: true });
    var node = lookup.node;
    var readdir = FS.checkOpExists(node.node_ops.readdir, 54);
    return readdir(node);
  },
  unlink(path) {
    var lookup = FS.lookupPath(path, { parent: true });
    var parent = lookup.node;
    if (!parent) {
      throw new FS.ErrnoError(44);
    }
    var name = PATH.basename(path);
    var node = FS.lookupNode(parent, name);
    var errCode = FS.mayDelete(parent, name, false);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    if (!parent.node_ops.unlink) {
      throw new FS.ErrnoError(63);
    }
    if (FS.isMountpoint(node)) {
      throw new FS.ErrnoError(10);
    }
    parent.node_ops.unlink(parent, name);
    FS.destroyNode(node);
  },
  readlink(path) {
    var lookup = FS.lookupPath(path);
    var link = lookup.node;
    if (!link) {
      throw new FS.ErrnoError(44);
    }
    if (!link.node_ops.readlink) {
      throw new FS.ErrnoError(28);
    }
    return link.node_ops.readlink(link);
  },
  stat(path, dontFollow) {
    var lookup = FS.lookupPath(path, { follow: !dontFollow });
    var node = lookup.node;
    var getattr = FS.checkOpExists(node.node_ops.getattr, 63);
    return getattr(node);
  },
  fstat(fd) {
    var stream = FS.getStreamChecked(fd);
    var node = stream.node;
    var getattr = stream.stream_ops.getattr;
    var arg = getattr ? stream : node;
    getattr ??= node.node_ops.getattr;
    FS.checkOpExists(getattr, 63);
    return getattr(arg);
  },
  lstat(path) {
    return FS.stat(path, true);
  },
  doChmod(stream, node, mode, dontFollow) {
    FS.doSetAttr(stream, node, {
      mode: (mode & 4095) | (node.mode & ~4095),
      ctime: Date.now(),
      dontFollow,
    });
  },
  chmod(path, mode, dontFollow) {
    var node;
    if (typeof path == "string") {
      var lookup = FS.lookupPath(path, { follow: !dontFollow });
      node = lookup.node;
    } else {
      node = path;
    }
    FS.doChmod(null, node, mode, dontFollow);
  },
  lchmod(path, mode) {
    FS.chmod(path, mode, true);
  },
  fchmod(fd, mode) {
    var stream = FS.getStreamChecked(fd);
    FS.doChmod(stream, stream.node, mode, false);
  },
  doChown(stream, node, dontFollow) {
    FS.doSetAttr(stream, node, { timestamp: Date.now(), dontFollow });
  },
  chown(path, uid, gid, dontFollow) {
    var node;
    if (typeof path == "string") {
      var lookup = FS.lookupPath(path, { follow: !dontFollow });
      node = lookup.node;
    } else {
      node = path;
    }
    FS.doChown(null, node, dontFollow);
  },
  lchown(path, uid, gid) {
    FS.chown(path, uid, gid, true);
  },
  fchown(fd, uid, gid) {
    var stream = FS.getStreamChecked(fd);
    FS.doChown(stream, stream.node, false);
  },
  doTruncate(stream, node, len) {
    if (FS.isDir(node.mode)) {
      throw new FS.ErrnoError(31);
    }
    if (!FS.isFile(node.mode)) {
      throw new FS.ErrnoError(28);
    }
    var errCode = FS.nodePermissions(node, "w");
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    FS.doSetAttr(stream, node, { size: len, timestamp: Date.now() });
  },
  truncate(path, len) {
    if (len < 0) {
      throw new FS.ErrnoError(28);
    }
    var node;
    if (typeof path == "string") {
      var lookup = FS.lookupPath(path, { follow: true });
      node = lookup.node;
    } else {
      node = path;
    }
    FS.doTruncate(null, node, len);
  },
  ftruncate(fd, len) {
    var stream = FS.getStreamChecked(fd);
    if (len < 0 || (stream.flags & 2097155) === 0) {
      throw new FS.ErrnoError(28);
    }
    FS.doTruncate(stream, stream.node, len);
  },
  utime(path, atime, mtime) {
    var lookup = FS.lookupPath(path, { follow: true });
    var node = lookup.node;
    var setattr = FS.checkOpExists(node.node_ops.setattr, 63);
    setattr(node, { atime, mtime });
  },
  open(path, flags, mode = 438) {
    if (path === "") {
      throw new FS.ErrnoError(44);
    }
    flags = FS_modeStringToFlags(flags);
    if (flags & 64) {
      mode = (mode & 4095) | 32768;
    } else {
      mode = 0;
    }
    var node;
    var isDirPath;
    if (typeof path == "object") {
      node = path;
    } else {
      isDirPath = path.endsWith("/");
      var lookup = FS.lookupPath(path, {
        follow: !(flags & 131072),
        noent_okay: true,
      });
      node = lookup.node;
      path = lookup.path;
    }
    var created = false;
    if (flags & 64) {
      if (node) {
        if (flags & 128) {
          throw new FS.ErrnoError(20);
        }
      } else if (isDirPath) {
        throw new FS.ErrnoError(31);
      } else {
        node = FS.mknod(path, mode | 511, 0);
        created = true;
      }
    }
    if (!node) {
      throw new FS.ErrnoError(44);
    }
    if (FS.isChrdev(node.mode)) {
      flags &= ~512;
    }
    if (flags & 65536 && !FS.isDir(node.mode)) {
      throw new FS.ErrnoError(54);
    }
    if (!created) {
      var errCode = FS.mayOpen(node, flags);
      if (errCode) {
        throw new FS.ErrnoError(errCode);
      }
    }
    if (flags & 512 && !created) {
      FS.truncate(node, 0);
    }
    flags &= ~(128 | 512 | 131072);
    var stream = FS.createStream({
      node,
      path: FS.getPath(node),
      flags,
      seekable: true,
      position: 0,
      stream_ops: node.stream_ops,
      ungotten: [],
      error: false,
    });
    if (stream.stream_ops.open) {
      stream.stream_ops.open(stream);
    }
    if (created) {
      FS.chmod(node, mode & 511);
    }
    return stream;
  },
  close(stream) {
    if (FS.isClosed(stream)) {
      throw new FS.ErrnoError(8);
    }
    if (stream.getdents) stream.getdents = null;
    try {
      if (stream.stream_ops.close) {
        stream.stream_ops.close(stream);
      }
    } catch (e) {
      throw e;
    } finally {
      FS.closeStream(stream.fd);
    }
    stream.fd = null;
  },
  isClosed(stream) {
    return stream.fd === null;
  },
  llseek(stream, offset, whence) {
    if (FS.isClosed(stream)) {
      throw new FS.ErrnoError(8);
    }
    if (!stream.seekable || !stream.stream_ops.llseek) {
      throw new FS.ErrnoError(70);
    }
    if (whence != 0 && whence != 1 && whence != 2) {
      throw new FS.ErrnoError(28);
    }
    stream.position = stream.stream_ops.llseek(stream, offset, whence);
    stream.ungotten = [];
    return stream.position;
  },
  read(stream, buffer, offset, length, position) {
    if (length < 0 || position < 0) {
      throw new FS.ErrnoError(28);
    }
    if (FS.isClosed(stream)) {
      throw new FS.ErrnoError(8);
    }
    if ((stream.flags & 2097155) === 1) {
      throw new FS.ErrnoError(8);
    }
    if (FS.isDir(stream.node.mode)) {
      throw new FS.ErrnoError(31);
    }
    if (!stream.stream_ops.read) {
      throw new FS.ErrnoError(28);
    }
    var seeking = typeof position != "undefined";
    if (!seeking) {
      position = stream.position;
    } else if (!stream.seekable) {
      throw new FS.ErrnoError(70);
    }
    var bytesRead = stream.stream_ops.read(
      stream,
      buffer,
      offset,
      length,
      position,
    );
    if (!seeking) stream.position += bytesRead;
    return bytesRead;
  },
  write(stream, buffer, offset, length, position, canOwn) {
    if (length < 0 || position < 0) {
      throw new FS.ErrnoError(28);
    }
    if (FS.isClosed(stream)) {
      throw new FS.ErrnoError(8);
    }
    if ((stream.flags & 2097155) === 0) {
      throw new FS.ErrnoError(8);
    }
    if (FS.isDir(stream.node.mode)) {
      throw new FS.ErrnoError(31);
    }
    if (!stream.stream_ops.write) {
      throw new FS.ErrnoError(28);
    }
    if (stream.seekable && stream.flags & 1024) {
      FS.llseek(stream, 0, 2);
    }
    var seeking = typeof position != "undefined";
    if (!seeking) {
      position = stream.position;
    } else if (!stream.seekable) {
      throw new FS.ErrnoError(70);
    }
    var bytesWritten = stream.stream_ops.write(
      stream,
      buffer,
      offset,
      length,
      position,
      canOwn,
    );
    if (!seeking) stream.position += bytesWritten;
    return bytesWritten;
  },
  mmap(stream, length, position, prot, flags) {
    if (
      (prot & 2) !== 0 &&
      (flags & 2) === 0 &&
      (stream.flags & 2097155) !== 2
    ) {
      throw new FS.ErrnoError(2);
    }
    if ((stream.flags & 2097155) === 1) {
      throw new FS.ErrnoError(2);
    }
    if (!stream.stream_ops.mmap) {
      throw new FS.ErrnoError(43);
    }
    if (!length) {
      throw new FS.ErrnoError(28);
    }
    return stream.stream_ops.mmap(stream, length, position, prot, flags);
  },
  msync(stream, buffer, offset, length, mmapFlags) {
    if (!stream.stream_ops.msync) {
      return 0;
    }
    return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags);
  },
  ioctl(stream, cmd, arg) {
    if (!stream.stream_ops.ioctl) {
      throw new FS.ErrnoError(59);
    }
    return stream.stream_ops.ioctl(stream, cmd, arg);
  },
  readFile(path, opts = {}) {
    opts.flags = opts.flags || 0;
    opts.encoding = opts.encoding || "binary";
    if (opts.encoding !== "utf8" && opts.encoding !== "binary") {
      abort(`Invalid encoding type "${opts.encoding}"`);
    }
    var stream = FS.open(path, opts.flags);
    var stat = FS.stat(path);
    var length = stat.size;
    var buf = new Uint8Array(length);
    FS.read(stream, buf, 0, length, 0);
    if (opts.encoding === "utf8") {
      buf = UTF8ArrayToString(buf);
    }
    FS.close(stream);
    return buf;
  },
  writeFile(path, data, opts = {}) {
    opts.flags = opts.flags || 577;
    var stream = FS.open(path, opts.flags, opts.mode);
    data = FS_fileDataToTypedArray(data);
    FS.write(stream, data, 0, data.byteLength, undefined, opts.canOwn);
    FS.close(stream);
  },
  cwd: () => FS.currentPath,
  chdir(path) {
    var lookup = FS.lookupPath(path, { follow: true });
    if (lookup.node === null) {
      throw new FS.ErrnoError(44);
    }
    if (!FS.isDir(lookup.node.mode)) {
      throw new FS.ErrnoError(54);
    }
    var errCode = FS.nodePermissions(lookup.node, "x");
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    FS.currentPath = lookup.path;
  },
  createDefaultDirectories() {
    FS.mkdir("/tmp");
    FS.mkdir("/home");
    FS.mkdir("/home/web_user");
  },
  createDefaultDevices() {
    FS.mkdir("/dev");
    FS.registerDevice(FS.makedev(1, 3), {
      read: () => 0,
      write: (stream, buffer, offset, length, pos) => length,
      llseek: () => 0,
    });
    FS.mkdev("/dev/null", FS.makedev(1, 3));
    TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
    TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
    FS.mkdev("/dev/tty", FS.makedev(5, 0));
    FS.mkdev("/dev/tty1", FS.makedev(6, 0));
    var randomBuffer = new Uint8Array(1024),
      randomLeft = 0;
    var randomByte = () => {
      if (randomLeft === 0) {
        randomFill(randomBuffer);
        randomLeft = randomBuffer.byteLength;
      }
      return randomBuffer[--randomLeft];
    };
    FS.createDevice("/dev", "random", randomByte);
    FS.createDevice("/dev", "urandom", randomByte);
    FS.mkdir("/dev/shm");
    FS.mkdir("/dev/shm/tmp");
  },
  createSpecialDirectories() {
    FS.mkdir("/proc");
    var proc_self = FS.mkdir("/proc/self");
    FS.mkdir("/proc/self/fd");
    FS.mount(
      {
        mount() {
          var node = FS.createNode(proc_self, "fd", 16895, 73);
          node.stream_ops = { llseek: MEMFS.stream_ops.llseek };
          node.node_ops = {
            lookup(parent, name) {
              var fd = +name;
              var stream = FS.getStreamChecked(fd);
              var ret = {
                parent: null,
                mount: { mountpoint: "fake" },
                node_ops: { readlink: () => stream.path },
                id: fd + 1,
              };
              ret.parent = ret;
              return ret;
            },
            readdir() {
              return Array.from(FS.streams.entries())
                .filter(([k, v]) => v)
                .map(([k, v]) => k.toString());
            },
          };
          return node;
        },
      },
      {},
      "/proc/self/fd",
    );
  },
  createStandardStreams(input, output, error) {
    if (input) {
      FS.createDevice("/dev", "stdin", input);
    } else {
      FS.symlink("/dev/tty", "/dev/stdin");
    }
    if (output) {
      FS.createDevice("/dev", "stdout", null, output);
    } else {
      FS.symlink("/dev/tty", "/dev/stdout");
    }
    if (error) {
      FS.createDevice("/dev", "stderr", null, error);
    } else {
      FS.symlink("/dev/tty1", "/dev/stderr");
    }
    var stdin = FS.open("/dev/stdin", 0);
    var stdout = FS.open("/dev/stdout", 1);
    var stderr = FS.open("/dev/stderr", 1);
  },
  staticInit() {
    FS.nameTable = new Array(4096);
    FS.mount(MEMFS, {}, "/");
    FS.createDefaultDirectories();
    FS.createDefaultDevices();
    FS.createSpecialDirectories();
    FS.filesystems = { MEMFS };
  },
  init(input, output, error) {
    FS.initialized = true;
    input ??= Module["stdin"];
    output ??= Module["stdout"];
    error ??= Module["stderr"];
    FS.createStandardStreams(input, output, error);
  },
  quit() {
    FS.initialized = false;
    for (var stream of FS.streams) {
      if (stream) {
        FS.close(stream);
      }
    }
  },
  findObject(path, dontResolveLastLink) {
    var ret = FS.analyzePath(path, dontResolveLastLink);
    if (!ret.exists) {
      return null;
    }
    return ret.object;
  },
  analyzePath(path, dontResolveLastLink) {
    try {
      var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
      path = lookup.path;
    } catch (e) {}
    var ret = {
      isRoot: false,
      exists: false,
      error: 0,
      name: null,
      path: null,
      object: null,
      parentExists: false,
      parentPath: null,
      parentObject: null,
    };
    try {
      var lookup = FS.lookupPath(path, { parent: true });
      ret.parentExists = true;
      ret.parentPath = lookup.path;
      ret.parentObject = lookup.node;
      ret.name = PATH.basename(path);
      lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
      ret.exists = true;
      ret.path = lookup.path;
      ret.object = lookup.node;
      ret.name = lookup.node.name;
      ret.isRoot = lookup.path === "/";
    } catch (e) {
      ret.error = e.errno;
    }
    return ret;
  },
  createPath(parent, path, canRead, canWrite) {
    parent = typeof parent == "string" ? parent : FS.getPath(parent);
    var parts = path.split("/").reverse();
    while (parts.length) {
      var part = parts.pop();
      if (!part) continue;
      var current = PATH.join2(parent, part);
      try {
        FS.mkdir(current);
      } catch (e) {
        if (e.errno != 20) throw e;
      }
      parent = current;
    }
    return current;
  },
  createFile(parent, name, properties, canRead, canWrite) {
    var path = PATH.join2(
      typeof parent == "string" ? parent : FS.getPath(parent),
      name,
    );
    var mode = FS_getMode(canRead, canWrite);
    return FS.create(path, mode);
  },
  createDataFile(parent, name, data, canRead, canWrite, canOwn) {
    var path = name;
    if (parent) {
      parent = typeof parent == "string" ? parent : FS.getPath(parent);
      path = name ? PATH.join2(parent, name) : parent;
    }
    var mode = FS_getMode(canRead, canWrite);
    var node = FS.create(path, mode);
    if (data) {
      data = FS_fileDataToTypedArray(data);
      FS.chmod(node, mode | 146);
      var stream = FS.open(node, 577);
      FS.write(stream, data, 0, data.length, 0, canOwn);
      FS.close(stream);
      FS.chmod(node, mode);
    }
  },
  createDevice(parent, name, input, output) {
    var path = PATH.join2(
      typeof parent == "string" ? parent : FS.getPath(parent),
      name,
    );
    var mode = FS_getMode(!!input, !!output);
    FS.createDevice.major ??= 64;
    var dev = FS.makedev(FS.createDevice.major++, 0);
    FS.registerDevice(dev, {
      open(stream) {
        stream.seekable = false;
      },
      close(stream) {
        if (output?.buffer?.length) {
          output(10);
        }
      },
      read(stream, buffer, offset, length, pos) {
        var bytesRead = 0;
        for (var i = 0; i < length; i++) {
          var result;
          try {
            result = input();
          } catch (e) {
            throw new FS.ErrnoError(29);
          }
          if (result === undefined && bytesRead === 0) {
            throw new FS.ErrnoError(6);
          }
          if (result === null || result === undefined) break;
          bytesRead++;
          buffer[offset + i] = result;
        }
        if (bytesRead) {
          stream.node.atime = Date.now();
        }
        return bytesRead;
      },
      write(stream, buffer, offset, length, pos) {
        for (var i = 0; i < length; i++) {
          try {
            output(buffer[offset + i]);
          } catch (e) {
            throw new FS.ErrnoError(29);
          }
        }
        if (length) {
          stream.node.mtime = stream.node.ctime = Date.now();
        }
        return i;
      },
    });
    return FS.mkdev(path, mode, dev);
  },
  forceLoadFile(obj) {
    if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
    if (globalThis.XMLHttpRequest) {
      abort(
        "Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.",
      );
    } else {
      try {
        obj.contents = readBinary(obj.url);
      } catch (e) {
        throw new FS.ErrnoError(29);
      }
    }
  },
  createLazyFile(parent, name, url, canRead, canWrite) {
    class LazyUint8Array {
      lengthKnown = false;
      chunks = [];
      get(idx) {
        if (idx > this.length - 1 || idx < 0) {
          return undefined;
        }
        var chunkOffset = idx % this.chunkSize;
        var chunkNum = (idx / this.chunkSize) | 0;
        return this.getter(chunkNum)[chunkOffset];
      }
      setDataGetter(getter) {
        this.getter = getter;
      }
      cacheLength() {
        var xhr = new XMLHttpRequest();
        xhr.open("HEAD", url, false);
        xhr.send(null);
        if (!((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304))
          abort("Couldn't load " + url + ". Status: " + xhr.status);
        var datalength = Number(xhr.getResponseHeader("Content-length"));
        var header;
        var hasByteServing =
          (header = xhr.getResponseHeader("Accept-Ranges")) &&
          header === "bytes";
        var usesGzip =
          (header = xhr.getResponseHeader("Content-Encoding")) &&
          header === "gzip";
        var chunkSize = 1024 * 1024;
        if (!hasByteServing) chunkSize = datalength;
        var doXHR = (from, to) => {
          if (from > to)
            abort(
              "invalid range (" + from + ", " + to + ") or no bytes requested!",
            );
          if (to > datalength - 1)
            abort("only " + datalength + " bytes available! programmer error!");
          var xhr = new XMLHttpRequest();
          xhr.open("GET", url, false);
          if (datalength !== chunkSize)
            xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
          xhr.responseType = "arraybuffer";
          if (xhr.overrideMimeType) {
            xhr.overrideMimeType("text/plain; charset=x-user-defined");
          }
          xhr.send(null);
          if (!((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304))
            abort("Couldn't load " + url + ". Status: " + xhr.status);
          if (xhr.response !== undefined) {
            return new Uint8Array(xhr.response || []);
          }
          return intArrayFromString(xhr.responseText || "", true);
        };
        var lazyArray = this;
        lazyArray.setDataGetter((chunkNum) => {
          var start = chunkNum * chunkSize;
          var end = (chunkNum + 1) * chunkSize - 1;
          end = Math.min(end, datalength - 1);
          if (typeof lazyArray.chunks[chunkNum] == "undefined") {
            lazyArray.chunks[chunkNum] = doXHR(start, end);
          }
          if (typeof lazyArray.chunks[chunkNum] == "undefined")
            abort("doXHR failed!");
          return lazyArray.chunks[chunkNum];
        });
        if (usesGzip || !datalength) {
          chunkSize = datalength = 1;
          datalength = this.getter(0).length;
          chunkSize = datalength;
          out(
            "LazyFiles on gzip forces download of the whole file when length is accessed",
          );
        }
        this._length = datalength;
        this._chunkSize = chunkSize;
        this.lengthKnown = true;
      }
      get length() {
        if (!this.lengthKnown) {
          this.cacheLength();
        }
        return this._length;
      }
      get chunkSize() {
        if (!this.lengthKnown) {
          this.cacheLength();
        }
        return this._chunkSize;
      }
    }
    if (globalThis.XMLHttpRequest) {
      if (!ENVIRONMENT_IS_WORKER)
        abort(
          "Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc",
        );
      var lazyArray = new LazyUint8Array();
      var properties = { isDevice: false, contents: lazyArray };
    } else {
      var properties = { isDevice: false, url };
    }
    var node = FS.createFile(parent, name, properties, canRead, canWrite);
    if (properties.contents) {
      node.contents = properties.contents;
    } else if (properties.url) {
      node.contents = null;
      node.url = properties.url;
    }
    Object.defineProperties(node, {
      usedBytes: {
        get: function () {
          return this.contents.length;
        },
      },
    });
    var stream_ops = {};
    for (const [key, fn] of Object.entries(node.stream_ops)) {
      stream_ops[key] = (...args) => {
        FS.forceLoadFile(node);
        return fn(...args);
      };
    }
    function writeChunks(stream, buffer, offset, length, position) {
      var contents = stream.node.contents;
      if (position >= contents.length) return 0;
      var size = Math.min(contents.length - position, length);
      if (contents.slice) {
        for (var i = 0; i < size; i++) {
          buffer[offset + i] = contents[position + i];
        }
      } else {
        for (var i = 0; i < size; i++) {
          buffer[offset + i] = contents.get(position + i);
        }
      }
      return size;
    }
    stream_ops.read = (stream, buffer, offset, length, position) => {
      FS.forceLoadFile(node);
      return writeChunks(stream, buffer, offset, length, position);
    };
    stream_ops.mmap = (stream, length, position, prot, flags) => {
      FS.forceLoadFile(node);
      var ptr = mmapAlloc(length);
      if (!ptr) {
        throw new FS.ErrnoError(48);
      }
      writeChunks(stream, HEAP8, ptr, length, position);
      return { ptr, allocated: true };
    };
    node.stream_ops = stream_ops;
    return node;
  },
};
var SYSCALLS = {
  calculateAt(dirfd, path, allowEmpty) {
    if (PATH.isAbs(path)) {
      return path;
    }
    var dir;
    if (dirfd === -100) {
      dir = FS.cwd();
    } else {
      var dirstream = SYSCALLS.getStreamFromFD(dirfd);
      dir = dirstream.path;
    }
    if (path.length == 0) {
      if (!allowEmpty) {
        throw new FS.ErrnoError(44);
      }
      return dir;
    }
    return dir + "/" + path;
  },
  writeStat(buf, stat) {
    HEAPU32[buf >> 2] = stat.dev;
    HEAPU32[(buf + 4) >> 2] = stat.mode;
    HEAPU32[(buf + 8) >> 2] = stat.nlink;
    HEAPU32[(buf + 12) >> 2] = stat.uid;
    HEAPU32[(buf + 16) >> 2] = stat.gid;
    HEAPU32[(buf + 20) >> 2] = stat.rdev;
    ((tempI64 = [
      stat.size >>> 0,
      ((tempDouble = stat.size),
      +Math.abs(tempDouble) >= 1
        ? tempDouble > 0
          ? +Math.floor(tempDouble / 4294967296) >>> 0
          : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>>
            0
        : 0),
    ]),
      (HEAP32[(buf + 24) >> 2] = tempI64[0]),
      (HEAP32[(buf + 28) >> 2] = tempI64[1]));
    HEAP32[(buf + 32) >> 2] = 4096;
    HEAP32[(buf + 36) >> 2] = stat.blocks;
    var atime = stat.atime.getTime();
    var mtime = stat.mtime.getTime();
    var ctime = stat.ctime.getTime();
    ((tempI64 = [
      Math.floor(atime / 1e3) >>> 0,
      ((tempDouble = Math.floor(atime / 1e3)),
      +Math.abs(tempDouble) >= 1
        ? tempDouble > 0
          ? +Math.floor(tempDouble / 4294967296) >>> 0
          : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>>
            0
        : 0),
    ]),
      (HEAP32[(buf + 40) >> 2] = tempI64[0]),
      (HEAP32[(buf + 44) >> 2] = tempI64[1]));
    HEAPU32[(buf + 48) >> 2] = (atime % 1e3) * 1e3 * 1e3;
    ((tempI64 = [
      Math.floor(mtime / 1e3) >>> 0,
      ((tempDouble = Math.floor(mtime / 1e3)),
      +Math.abs(tempDouble) >= 1
        ? tempDouble > 0
          ? +Math.floor(tempDouble / 4294967296) >>> 0
          : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>>
            0
        : 0),
    ]),
      (HEAP32[(buf + 56) >> 2] = tempI64[0]),
      (HEAP32[(buf + 60) >> 2] = tempI64[1]));
    HEAPU32[(buf + 64) >> 2] = (mtime % 1e3) * 1e3 * 1e3;
    ((tempI64 = [
      Math.floor(ctime / 1e3) >>> 0,
      ((tempDouble = Math.floor(ctime / 1e3)),
      +Math.abs(tempDouble) >= 1
        ? tempDouble > 0
          ? +Math.floor(tempDouble / 4294967296) >>> 0
          : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>>
            0
        : 0),
    ]),
      (HEAP32[(buf + 72) >> 2] = tempI64[0]),
      (HEAP32[(buf + 76) >> 2] = tempI64[1]));
    HEAPU32[(buf + 80) >> 2] = (ctime % 1e3) * 1e3 * 1e3;
    ((tempI64 = [
      stat.ino >>> 0,
      ((tempDouble = stat.ino),
      +Math.abs(tempDouble) >= 1
        ? tempDouble > 0
          ? +Math.floor(tempDouble / 4294967296) >>> 0
          : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>>
            0
        : 0),
    ]),
      (HEAP32[(buf + 88) >> 2] = tempI64[0]),
      (HEAP32[(buf + 92) >> 2] = tempI64[1]));
    return 0;
  },
  writeStatFs(buf, stats) {
    HEAPU32[(buf + 4) >> 2] = stats.bsize;
    HEAPU32[(buf + 60) >> 2] = stats.bsize;
    ((tempI64 = [
      stats.blocks >>> 0,
      ((tempDouble = stats.blocks),
      +Math.abs(tempDouble) >= 1
        ? tempDouble > 0
          ? +Math.floor(tempDouble / 4294967296) >>> 0
          : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>>
            0
        : 0),
    ]),
      (HEAP32[(buf + 8) >> 2] = tempI64[0]),
      (HEAP32[(buf + 12) >> 2] = tempI64[1]));
    ((tempI64 = [
      stats.bfree >>> 0,
      ((tempDouble = stats.bfree),
      +Math.abs(tempDouble) >= 1
        ? tempDouble > 0
          ? +Math.floor(tempDouble / 4294967296) >>> 0
          : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>>
            0
        : 0),
    ]),
      (HEAP32[(buf + 16) >> 2] = tempI64[0]),
      (HEAP32[(buf + 20) >> 2] = tempI64[1]));
    ((tempI64 = [
      stats.bavail >>> 0,
      ((tempDouble = stats.bavail),
      +Math.abs(tempDouble) >= 1
        ? tempDouble > 0
          ? +Math.floor(tempDouble / 4294967296) >>> 0
          : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>>
            0
        : 0),
    ]),
      (HEAP32[(buf + 24) >> 2] = tempI64[0]),
      (HEAP32[(buf + 28) >> 2] = tempI64[1]));
    ((tempI64 = [
      stats.files >>> 0,
      ((tempDouble = stats.files),
      +Math.abs(tempDouble) >= 1
        ? tempDouble > 0
          ? +Math.floor(tempDouble / 4294967296) >>> 0
          : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>>
            0
        : 0),
    ]),
      (HEAP32[(buf + 32) >> 2] = tempI64[0]),
      (HEAP32[(buf + 36) >> 2] = tempI64[1]));
    ((tempI64 = [
      stats.ffree >>> 0,
      ((tempDouble = stats.ffree),
      +Math.abs(tempDouble) >= 1
        ? tempDouble > 0
          ? +Math.floor(tempDouble / 4294967296) >>> 0
          : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>>
            0
        : 0),
    ]),
      (HEAP32[(buf + 40) >> 2] = tempI64[0]),
      (HEAP32[(buf + 44) >> 2] = tempI64[1]));
    HEAPU32[(buf + 48) >> 2] = stats.fsid;
    HEAPU32[(buf + 64) >> 2] = stats.flags;
    HEAPU32[(buf + 56) >> 2] = stats.namelen;
  },
  doMsync(addr, stream, len, flags, offset) {
    if (!FS.isFile(stream.node.mode)) {
      throw new FS.ErrnoError(43);
    }
    if (flags & 2) {
      return 0;
    }
    var buffer = HEAPU8.slice(addr, addr + len);
    FS.msync(stream, buffer, offset, len, flags);
  },
  getStreamFromFD(fd) {
    var stream = FS.getStreamChecked(fd);
    return stream;
  },
  varargs: undefined,
  getStr(ptr) {
    var ret = UTF8ToString(ptr);
    return ret;
  },
};
function ___syscall_fcntl64(fd, cmd, varargs) {
  SYSCALLS.varargs = varargs;
  try {
    var stream = SYSCALLS.getStreamFromFD(fd);
    switch (cmd) {
      case 0: {
        var arg = syscallGetVarargI();
        if (arg < 0) {
          return -28;
        }
        while (FS.streams[arg]) {
          arg++;
        }
        var newStream;
        newStream = FS.dupStream(stream, arg);
        return newStream.fd;
      }
      case 1:
      case 2:
        return 0;
      case 3:
        return stream.flags;
      case 4: {
        var arg = syscallGetVarargI();
        stream.flags |= arg;
        return 0;
      }
      case 12: {
        var arg = syscallGetVarargP();
        var offset = 0;
        HEAP16[(arg + offset) >> 1] = 2;
        return 0;
      }
      case 13:
      case 14:
        return 0;
    }
    return -28;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}
function ___syscall_ioctl(fd, op, varargs) {
  SYSCALLS.varargs = varargs;
  try {
    var stream = SYSCALLS.getStreamFromFD(fd);
    switch (op) {
      case 21509: {
        if (!stream.tty) return -59;
        return 0;
      }
      case 21505: {
        if (!stream.tty) return -59;
        if (stream.tty.ops.ioctl_tcgets) {
          var termios = stream.tty.ops.ioctl_tcgets(stream);
          var argp = syscallGetVarargP();
          HEAP32[argp >> 2] = termios.c_iflag || 0;
          HEAP32[(argp + 4) >> 2] = termios.c_oflag || 0;
          HEAP32[(argp + 8) >> 2] = termios.c_cflag || 0;
          HEAP32[(argp + 12) >> 2] = termios.c_lflag || 0;
          for (var i = 0; i < 32; i++) {
            HEAP8[argp + i + 17] = termios.c_cc[i] || 0;
          }
          return 0;
        }
        return 0;
      }
      case 21510:
      case 21511:
      case 21512: {
        if (!stream.tty) return -59;
        return 0;
      }
      case 21506:
      case 21507:
      case 21508: {
        if (!stream.tty) return -59;
        if (stream.tty.ops.ioctl_tcsets) {
          var argp = syscallGetVarargP();
          var c_iflag = HEAP32[argp >> 2];
          var c_oflag = HEAP32[(argp + 4) >> 2];
          var c_cflag = HEAP32[(argp + 8) >> 2];
          var c_lflag = HEAP32[(argp + 12) >> 2];
          var c_cc = [];
          for (var i = 0; i < 32; i++) {
            c_cc.push(HEAP8[argp + i + 17]);
          }
          return stream.tty.ops.ioctl_tcsets(stream.tty, op, {
            c_iflag,
            c_oflag,
            c_cflag,
            c_lflag,
            c_cc,
          });
        }
        return 0;
      }
      case 21519: {
        if (!stream.tty) return -59;
        var argp = syscallGetVarargP();
        HEAP32[argp >> 2] = 0;
        return 0;
      }
      case 21520: {
        if (!stream.tty) return -59;
        return -28;
      }
      case 21537:
      case 21531: {
        var argp = syscallGetVarargP();
        return FS.ioctl(stream, op, argp);
      }
      case 21523: {
        if (!stream.tty) return -59;
        if (stream.tty.ops.ioctl_tiocgwinsz) {
          var winsize = stream.tty.ops.ioctl_tiocgwinsz(stream.tty);
          var argp = syscallGetVarargP();
          HEAP16[argp >> 1] = winsize[0];
          HEAP16[(argp + 2) >> 1] = winsize[1];
        }
        return 0;
      }
      case 21524: {
        if (!stream.tty) return -59;
        return 0;
      }
      case 21515: {
        if (!stream.tty) return -59;
        return 0;
      }
      default:
        return -28;
    }
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}
function ___syscall_openat(dirfd, path, flags, varargs) {
  SYSCALLS.varargs = varargs;
  try {
    path = SYSCALLS.getStr(path);
    path = SYSCALLS.calculateAt(dirfd, path);
    var mode = varargs ? syscallGetVarargI() : 0;
    return FS.open(path, flags, mode).fd;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}
var __abort_js = () => abort("");
var stringToUTF8 = (str, outPtr, maxBytesToWrite) =>
  stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
var getHeapMax = () => 2147483648;
var alignMemory = (size, alignment) => Math.ceil(size / alignment) * alignment;
var growMemory = (size) => {
  var oldHeapSize = wasmMemory.buffer.byteLength;
  var pages = ((size - oldHeapSize + 65535) / 65536) | 0;
  try {
    wasmMemory.grow(pages);
    updateMemoryViews();
    return 1;
  } catch (e) {}
};
var _emscripten_resize_heap = (requestedSize) => {
  var oldSize = HEAPU8.length;
  requestedSize >>>= 0;
  var maxHeapSize = getHeapMax();
  if (requestedSize > maxHeapSize) {
    return false;
  }
  for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
    var overGrownHeapSize = oldSize * (1 + 0.2 / cutDown);
    overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
    var newSize = Math.min(
      maxHeapSize,
      alignMemory(Math.max(requestedSize, overGrownHeapSize), 65536),
    );
    var replacement = growMemory(newSize);
    if (replacement) {
      return true;
    }
  }
  return false;
};
var ENV = {};
var getExecutableName = () => thisProgram || "./this.program";
var getEnvStrings = () => {
  if (!getEnvStrings.strings) {
    var lang =
      (globalThis.navigator?.language ?? "C").replace("-", "_") + ".UTF-8";
    var env = {
      USER: "web_user",
      LOGNAME: "web_user",
      PATH: "/",
      PWD: "/",
      HOME: "/home/web_user",
      LANG: lang,
      _: getExecutableName(),
    };
    for (var x in ENV) {
      if (ENV[x] === undefined) delete env[x];
      else env[x] = ENV[x];
    }
    var strings = [];
    for (var x in env) {
      strings.push(`${x}=${env[x]}`);
    }
    getEnvStrings.strings = strings;
  }
  return getEnvStrings.strings;
};
var _environ_get = (__environ, environ_buf) => {
  var bufSize = 0;
  var envp = 0;
  for (var string of getEnvStrings()) {
    var ptr = environ_buf + bufSize;
    HEAPU32[(__environ + envp) >> 2] = ptr;
    bufSize += stringToUTF8(string, ptr, Infinity) + 1;
    envp += 4;
  }
  return 0;
};
var _environ_sizes_get = (penviron_count, penviron_buf_size) => {
  var strings = getEnvStrings();
  HEAPU32[penviron_count >> 2] = strings.length;
  var bufSize = 0;
  for (var string of strings) {
    bufSize += lengthBytesUTF8(string) + 1;
  }
  HEAPU32[penviron_buf_size >> 2] = bufSize;
  return 0;
};
function _fd_close(fd) {
  try {
    var stream = SYSCALLS.getStreamFromFD(fd);
    FS.close(stream);
    return 0;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return e.errno;
  }
}
var doReadv = (stream, iov, iovcnt, offset) => {
  var ret = 0;
  for (var i = 0; i < iovcnt; i++) {
    var ptr = HEAPU32[iov >> 2];
    var len = HEAPU32[(iov + 4) >> 2];
    iov += 8;
    var curr = FS.read(stream, HEAP8, ptr, len, offset);
    if (curr < 0) return -1;
    ret += curr;
    if (curr < len) break;
    if (typeof offset != "undefined") {
      offset += curr;
    }
  }
  return ret;
};
function _fd_read(fd, iov, iovcnt, pnum) {
  try {
    var stream = SYSCALLS.getStreamFromFD(fd);
    var num = doReadv(stream, iov, iovcnt);
    HEAPU32[pnum >> 2] = num;
    return 0;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return e.errno;
  }
}
var convertI32PairToI53Checked = (lo, hi) =>
  (hi + 2097152) >>> 0 < 4194305 - !!lo ? (lo >>> 0) + hi * 4294967296 : NaN;
function _fd_seek(fd, offset_low, offset_high, whence, newOffset) {
  var offset = convertI32PairToI53Checked(offset_low, offset_high);
  try {
    if (isNaN(offset)) return 61;
    var stream = SYSCALLS.getStreamFromFD(fd);
    FS.llseek(stream, offset, whence);
    ((tempI64 = [
      stream.position >>> 0,
      ((tempDouble = stream.position),
      +Math.abs(tempDouble) >= 1
        ? tempDouble > 0
          ? +Math.floor(tempDouble / 4294967296) >>> 0
          : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>>
            0
        : 0),
    ]),
      (HEAP32[newOffset >> 2] = tempI64[0]),
      (HEAP32[(newOffset + 4) >> 2] = tempI64[1]));
    if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null;
    return 0;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return e.errno;
  }
}
var doWritev = (stream, iov, iovcnt, offset) => {
  var ret = 0;
  for (var i = 0; i < iovcnt; i++) {
    var ptr = HEAPU32[iov >> 2];
    var len = HEAPU32[(iov + 4) >> 2];
    iov += 8;
    var curr = FS.write(stream, HEAP8, ptr, len, offset);
    if (curr < 0) return -1;
    ret += curr;
    if (curr < len) {
      break;
    }
    if (typeof offset != "undefined") {
      offset += curr;
    }
  }
  return ret;
};
function _fd_write(fd, iov, iovcnt, pnum) {
  try {
    var stream = SYSCALLS.getStreamFromFD(fd);
    var num = doWritev(stream, iov, iovcnt);
    HEAPU32[pnum >> 2] = num;
    return 0;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return e.errno;
  }
}
var stringToNewUTF8 = (str) => {
  var size = lengthBytesUTF8(str) + 1;
  var ret = _malloc(size);
  if (ret) stringToUTF8(str, ret, size);
  return ret;
};
var allocateUTF8 = (...args) => stringToNewUTF8(...args);
FS.createPreloadedFile = FS_createPreloadedFile;
FS.preloadFile = FS_preloadFile;
FS.staticInit();
{
  if (Module["noExitRuntime"]) noExitRuntime = Module["noExitRuntime"];
  if (Module["preloadPlugins"]) preloadPlugins = Module["preloadPlugins"];
  if (Module["print"]) out = Module["print"];
  if (Module["printErr"]) err = Module["printErr"];
  if (Module["wasmBinary"]) wasmBinary = Module["wasmBinary"];
  if (Module["arguments"]) arguments_ = Module["arguments"];
  if (Module["thisProgram"]) thisProgram = Module["thisProgram"];
  if (Module["preInit"]) {
    if (typeof Module["preInit"] == "function")
      Module["preInit"] = [Module["preInit"]];
    while (Module["preInit"].length > 0) {
      Module["preInit"].shift()();
    }
  }
}
Module["getValue"] = getValue;
Module["UTF8ToString"] = UTF8ToString;
Module["FS"] = FS;
Module["allocateUTF8"] = allocateUTF8;
var _loadBook,
  _analyzePosition,
  _malloc,
  _free,
  dynCall_iij,
  dynCall_jiji,
  dynCall_viijii,
  dynCall_iiiiij,
  dynCall_iiiiijj,
  dynCall_iiiiiijj,
  memory,
  __indirect_function_table,
  wasmMemory;
function assignWasmExports(wasmExports) {
  _loadBook = Module["_loadBook"] = wasmExports["o"];
  _analyzePosition = Module["_analyzePosition"] = wasmExports["p"];
  _malloc = Module["_malloc"] = wasmExports["q"];
  _free = Module["_free"] = wasmExports["r"];
  dynCall_iij = wasmExports["dynCall_iij"];
  dynCall_jiji = wasmExports["dynCall_jiji"];
  dynCall_viijii = wasmExports["dynCall_viijii"];
  dynCall_iiiiij = wasmExports["dynCall_iiiiij"];
  dynCall_iiiiijj = wasmExports["dynCall_iiiiijj"];
  dynCall_iiiiiijj = wasmExports["dynCall_iiiiiijj"];
  memory = wasmMemory = Module["wasmMemory"] = wasmExports["m"];
  __indirect_function_table = wasmExports["__indirect_function_table"];
}
var wasmImports = {
  a: ___assert_fail,
  d: ___syscall_fcntl64,
  h: ___syscall_ioctl,
  i: ___syscall_openat,
  f: __abort_js,
  l: _emscripten_resize_heap,
  k: _environ_get,
  e: _environ_sizes_get,
  b: _fd_close,
  g: _fd_read,
  j: _fd_seek,
  c: _fd_write,
};
function run() {
  if (runDependencies > 0) {
    dependenciesFulfilled = run;
    return;
  }
  preRun();
  if (runDependencies > 0) {
    dependenciesFulfilled = run;
    return;
  }
  function doRun() {
    Module["calledRun"] = true;
    if (ABORT) return;
    initRuntime();
    Module["onRuntimeInitialized"]?.();
    postRun();
  }
  if (Module["setStatus"]) {
    Module["setStatus"]("Running...");
    setTimeout(() => {
      setTimeout(() => Module["setStatus"](""), 1);
      doRun();
    }, 1);
  } else {
    doRun();
  }
}
var wasmExports;
createWasm();
run();
