var Module;
if (!Module) Module = (typeof Module !== "undefined" ? Module : null) || {};
var moduleOverrides = {};
for (var key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}
var ENVIRONMENT_IS_WEB = false;
var ENVIRONMENT_IS_WORKER = false;
var ENVIRONMENT_IS_NODE = false;
var ENVIRONMENT_IS_SHELL = false;
if (Module["ENVIRONMENT"]) {
  if (Module["ENVIRONMENT"] === "WEB") {
    ENVIRONMENT_IS_WEB = true;
  } else if (Module["ENVIRONMENT"] === "WORKER") {
    ENVIRONMENT_IS_WORKER = true;
  } else if (Module["ENVIRONMENT"] === "NODE") {
    ENVIRONMENT_IS_NODE = true;
  } else if (Module["ENVIRONMENT"] === "SHELL") {
    ENVIRONMENT_IS_SHELL = true;
  } else {
    throw new Error(
      "The provided Module['ENVIRONMENT'] value is not valid. It must be one of: WEB|WORKER|NODE|SHELL."
    );
  }
} else {
  ENVIRONMENT_IS_WEB = typeof window === "object";
  ENVIRONMENT_IS_WORKER = typeof importScripts === "function";
  ENVIRONMENT_IS_NODE =
    typeof process === "object" &&
    typeof require === "function" &&
    !ENVIRONMENT_IS_WEB &&
    !ENVIRONMENT_IS_WORKER;
  ENVIRONMENT_IS_SHELL =
    !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
}
if (ENVIRONMENT_IS_NODE) {
  if (!Module["print"]) Module["print"] = console.log;
  if (!Module["printErr"]) Module["printErr"] = console.warn;
  var nodeFS;
  var nodePath;
  Module["read"] = function shell_read(filename, binary) {
    if (!nodeFS) nodeFS = require("fs");
    if (!nodePath) nodePath = require("path");
    filename = nodePath["normalize"](filename);
    var ret = nodeFS["readFileSync"](filename);
    return binary ? ret : ret.toString();
  };
  Module["readBinary"] = function readBinary(filename) {
    var ret = Module["read"](filename, true);
    if (!ret.buffer) {
      ret = new Uint8Array(ret);
    }
    assert(ret.buffer);
    return ret;
  };
  Module["load"] = function load(f) {
    globalEval(read(f));
  };
  if (!Module["thisProgram"]) {
    if (process["argv"].length > 1) {
      Module["thisProgram"] = process["argv"][1].replace(/\\/g, "/");
    } else {
      Module["thisProgram"] = "unknown-program";
    }
  }
  Module["arguments"] = process["argv"].slice(2);
  if (typeof module !== "undefined") {
    module["exports"] = Module;
  }
  process["on"]("uncaughtException", function (ex) {
    if (!(ex instanceof ExitStatus)) {
      throw ex;
    }
  });
  Module["inspect"] = function () {
    return "[Emscripten Module object]";
  };
} else if (ENVIRONMENT_IS_SHELL) {
  if (!Module["print"]) Module["print"] = print;
  if (typeof printErr != "undefined") Module["printErr"] = printErr;
  if (typeof read != "undefined") {
    Module["read"] = read;
  } else {
    Module["read"] = function shell_read() {
      throw "no read() available";
    };
  }
  Module["readBinary"] = function readBinary(f) {
    if (typeof readbuffer === "function") {
      return new Uint8Array(readbuffer(f));
    }
    var data = read(f, "binary");
    assert(typeof data === "object");
    return data;
  };
  if (typeof scriptArgs != "undefined") {
    Module["arguments"] = scriptArgs;
  } else if (typeof arguments != "undefined") {
    Module["arguments"] = arguments;
  }
  if (typeof quit === "function") {
    Module["quit"] = function (status, toThrow) {
      quit(status);
    };
  }
} else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module["read"] = function shell_read(url) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, false);
    xhr.send(null);
    return xhr.responseText;
  };
  if (ENVIRONMENT_IS_WORKER) {
    Module["readBinary"] = function readBinary(url) {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", url, false);
      xhr.responseType = "arraybuffer";
      xhr.send(null);
      return new Uint8Array(xhr.response);
    };
  }
  Module["readAsync"] = function readAsync(url, onload, onerror) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.responseType = "arraybuffer";
    xhr.onload = function xhr_onload() {
      if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) {
        onload(xhr.response);
      } else {
        onerror();
      }
    };
    xhr.onerror = onerror;
    xhr.send(null);
  };
  if (typeof arguments != "undefined") {
    Module["arguments"] = arguments;
  }
  if (typeof console !== "undefined") {
    if (!Module["print"])
      Module["print"] = function shell_print(x) {
        console.log(x);
      };
    if (!Module["printErr"])
      Module["printErr"] = function shell_printErr(x) {
        console.warn(x);
      };
  } else {
    var TRY_USE_DUMP = false;
    if (!Module["print"])
      Module["print"] =
        TRY_USE_DUMP && typeof dump !== "undefined"
          ? function (x) {
              dump(x);
            }
          : function (x) {};
  }
  if (ENVIRONMENT_IS_WORKER) {
    Module["load"] = importScripts;
  }
  if (typeof Module["setWindowTitle"] === "undefined") {
    Module["setWindowTitle"] = function (title) {
      document.title = title;
    };
  }
} else {
  throw "Unknown runtime environment. Where are we?";
}
function globalEval(x) {
  eval.call(null, x);
}
if (!Module["load"] && Module["read"]) {
  Module["load"] = function load(f) {
    globalEval(Module["read"](f));
  };
}
if (!Module["print"]) {
  Module["print"] = function () {};
}
if (!Module["printErr"]) {
  Module["printErr"] = Module["print"];
}
if (!Module["arguments"]) {
  Module["arguments"] = [];
}
if (!Module["thisProgram"]) {
  Module["thisProgram"] = "./this.program";
}
if (!Module["quit"]) {
  Module["quit"] = function (status, toThrow) {
    throw toThrow;
  };
}
Module.print = Module["print"];
Module.printErr = Module["printErr"];
Module["preRun"] = [];
Module["postRun"] = [];
for (var key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}
moduleOverrides = undefined;
var Runtime = {
  setTempRet0: function (value) {
    tempRet0 = value;
    return value;
  },
  getTempRet0: function () {
    return tempRet0;
  },
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  getNativeTypeSize: function (type) {
    switch (type) {
      case "i1":
      case "i8":
        return 1;
      case "i16":
        return 2;
      case "i32":
        return 4;
      case "i64":
        return 8;
      case "float":
        return 4;
      case "double":
        return 8;
      default: {
        if (type[type.length - 1] === "*") {
          return Runtime.QUANTUM_SIZE;
        } else if (type[0] === "i") {
          var bits = parseInt(type.substr(1));
          assert(bits % 8 === 0);
          return bits / 8;
        } else {
          return 0;
        }
      }
    }
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  STACK_ALIGN: 16,
  prepVararg: function (ptr, type) {
    if (type === "double" || type === "i64") {
      if (ptr & 7) {
        assert((ptr & 7) === 4);
        ptr += 4;
      }
    } else {
      assert((ptr & 3) === 0);
    }
    return ptr;
  },
  getAlignSize: function (type, size, vararg) {
    if (!vararg && (type == "i64" || type == "double")) return 8;
    if (!type) return Math.min(size, 8);
    return Math.min(
      size || (type ? Runtime.getNativeFieldSize(type) : 0),
      Runtime.QUANTUM_SIZE
    );
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      return Module["dynCall_" + sig].apply(null, [ptr].concat(args));
    } else {
      return Module["dynCall_" + sig].call(null, ptr);
    }
  },
  functionPointers: [],
  addFunction: function (func) {
    for (var i = 0; i < Runtime.functionPointers.length; i++) {
      if (!Runtime.functionPointers[i]) {
        Runtime.functionPointers[i] = func;
        return 2 * (1 + i);
      }
    }
    throw "Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.";
  },
  removeFunction: function (index) {
    Runtime.functionPointers[(index - 2) / 2] = null;
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    if (!func) return;
    assert(sig);
    if (!Runtime.funcWrappers[sig]) {
      Runtime.funcWrappers[sig] = {};
    }
    var sigCache = Runtime.funcWrappers[sig];
    if (!sigCache[func]) {
      if (sig.length === 1) {
        sigCache[func] = function dynCall_wrapper() {
          return Runtime.dynCall(sig, func);
        };
      } else if (sig.length === 2) {
        sigCache[func] = function dynCall_wrapper(arg) {
          return Runtime.dynCall(sig, func, [arg]);
        };
      } else {
        sigCache[func] = function dynCall_wrapper() {
          return Runtime.dynCall(
            sig,
            func,
            Array.prototype.slice.call(arguments)
          );
        };
      }
    }
    return sigCache[func];
  },
  getCompilerSetting: function (name) {
    throw "You must build with -s RETAIN_COMPILER_SETTINGS=1 for Runtime.getCompilerSetting or emscripten_get_compiler_setting to work";
  },
  stackAlloc: function (size) {
    var ret = STACKTOP;
    STACKTOP = (STACKTOP + size) | 0;
    STACKTOP = (STACKTOP + 15) & -16;
    return ret;
  },
  staticAlloc: function (size) {
    var ret = STATICTOP;
    STATICTOP = (STATICTOP + size) | 0;
    STATICTOP = (STATICTOP + 15) & -16;
    return ret;
  },
  dynamicAlloc: function (size) {
    var ret = HEAP32[DYNAMICTOP_PTR >> 2];
    var end = ((ret + size + 15) | 0) & -16;
    HEAP32[DYNAMICTOP_PTR >> 2] = end;
    if (end >= TOTAL_MEMORY) {
      var success = enlargeMemory();
      if (!success) {
        HEAP32[DYNAMICTOP_PTR >> 2] = ret;
        return 0;
      }
    }
    return ret;
  },
  alignMemory: function (size, quantum) {
    var ret = (size =
      Math.ceil(size / (quantum ? quantum : 16)) * (quantum ? quantum : 16));
    return ret;
  },
  makeBigInt: function (low, high, unsigned) {
    var ret = unsigned
      ? +(low >>> 0) + +(high >>> 0) * +4294967296
      : +(low >>> 0) + +(high | 0) * +4294967296;
    return ret;
  },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0,
};
Module["Runtime"] = Runtime;
var ABORT = 0;
var EXITSTATUS = 0;
function assert(condition, text) {
  if (!condition) {
    abort("Assertion failed: " + text);
  }
}
function getCFunc(ident) {
  var func = Module["_" + ident];
  if (!func) {
    try {
      func = eval("_" + ident);
    } catch (e) {}
  }
  assert(
    func,
    "Cannot call unknown function " +
      ident +
      " (perhaps LLVM optimizations or closure removed it?)"
  );
  return func;
}
var cwrap, ccall;
(function () {
  var JSfuncs = {
    stackSave: function () {
      Runtime.stackSave();
    },
    stackRestore: function () {
      Runtime.stackRestore();
    },
    arrayToC: function (arr) {
      var ret = Runtime.stackAlloc(arr.length);
      writeArrayToMemory(arr, ret);
      return ret;
    },
    stringToC: function (str) {
      var ret = 0;
      if (str !== null && str !== undefined && str !== 0) {
        var len = (str.length << 2) + 1;
        ret = Runtime.stackAlloc(len);
        stringToUTF8(str, ret, len);
      }
      return ret;
    },
  };
  var toC = { string: JSfuncs["stringToC"], array: JSfuncs["arrayToC"] };
  ccall = function ccallFunc(ident, returnType, argTypes, args, opts) {
    var func = getCFunc(ident);
    var cArgs = [];
    var stack = 0;
    if (args) {
      for (var i = 0; i < args.length; i++) {
        var converter = toC[argTypes[i]];
        if (converter) {
          if (stack === 0) stack = Runtime.stackSave();
          cArgs[i] = converter(args[i]);
        } else {
          cArgs[i] = args[i];
        }
      }
    }
    var ret = func.apply(null, cArgs);
    if (returnType === "string") ret = Pointer_stringify(ret);
    if (stack !== 0) {
      if (opts && opts.async) {
        EmterpreterAsync.asyncFinalizers.push(function () {
          Runtime.stackRestore(stack);
        });
        return;
      }
      Runtime.stackRestore(stack);
    }
    return ret;
  };
  var sourceRegex =
    /^function\s*[a-zA-Z$_0-9]*\s*\(([^)]*)\)\s*{\s*([^*]*?)[\s;]*(?:return\s*(.*?)[;\s]*)?}$/;
  function parseJSFunc(jsfunc) {
    var parsed = jsfunc.toString().match(sourceRegex).slice(1);
    return { arguments: parsed[0], body: parsed[1], returnValue: parsed[2] };
  }
  var JSsource = null;
  function ensureJSsource() {
    if (!JSsource) {
      JSsource = {};
      for (var fun in JSfuncs) {
        if (JSfuncs.hasOwnProperty(fun)) {
          JSsource[fun] = parseJSFunc(JSfuncs[fun]);
        }
      }
    }
  }
  cwrap = function cwrap(ident, returnType, argTypes) {
    argTypes = argTypes || [];
    var cfunc = getCFunc(ident);
    var numericArgs = argTypes.every(function (type) {
      return type === "number";
    });
    var numericRet = returnType !== "string";
    if (numericRet && numericArgs) {
      return cfunc;
    }
    var argNames = argTypes.map(function (x, i) {
      return "$" + i;
    });
    var funcstr = "(function(" + argNames.join(",") + ") {";
    var nargs = argTypes.length;
    if (!numericArgs) {
      ensureJSsource();
      funcstr += "var stack = " + JSsource["stackSave"].body + ";";
      for (var i = 0; i < nargs; i++) {
        var arg = argNames[i],
          type = argTypes[i];
        if (type === "number") continue;
        var convertCode = JSsource[type + "ToC"];
        funcstr += "var " + convertCode.arguments + " = " + arg + ";";
        funcstr += convertCode.body + ";";
        funcstr += arg + "=(" + convertCode.returnValue + ");";
      }
    }
    var cfuncname = parseJSFunc(function () {
      return cfunc;
    }).returnValue;
    funcstr += "var ret = " + cfuncname + "(" + argNames.join(",") + ");";
    if (!numericRet) {
      var strgfy = parseJSFunc(function () {
        return Pointer_stringify;
      }).returnValue;
      funcstr += "ret = " + strgfy + "(ret);";
    }
    if (!numericArgs) {
      ensureJSsource();
      funcstr += JSsource["stackRestore"].body.replace("()", "(stack)") + ";";
    }
    funcstr += "return ret})";
    return eval(funcstr);
  };
})();
Module["ccall"] = ccall;
Module["cwrap"] = cwrap;
function setValue(ptr, value, type, noSafe) {
  type = type || "i8";
  if (type.charAt(type.length - 1) === "*") type = "i32";
  switch (type) {
    case "i1":
      HEAP8[ptr >> 0] = value;
      break;
    case "i8":
      HEAP8[ptr >> 0] = value;
      break;
    case "i16":
      HEAP16[ptr >> 1] = value;
      break;
    case "i32":
      HEAP32[ptr >> 2] = value;
      break;
    case "i64":
      (tempI64 = [
        value >>> 0,
        ((tempDouble = value),
        +Math_abs(tempDouble) >= +1
          ? tempDouble > +0
            ? (Math_min(+Math_floor(tempDouble / +4294967296), +4294967295) |
                0) >>>
              0
            : ~~+Math_ceil(
                (tempDouble - +(~~tempDouble >>> 0)) / +4294967296
              ) >>> 0
          : 0),
      ]),
        (HEAP32[ptr >> 2] = tempI64[0]),
        (HEAP32[(ptr + 4) >> 2] = tempI64[1]);
      break;
    case "float":
      HEAPF32[ptr >> 2] = value;
      break;
    case "double":
      HEAPF64[ptr >> 3] = value;
      break;
    default:
      abort("invalid type for setValue: " + type);
  }
}
Module["setValue"] = setValue;
function getValue(ptr, type, noSafe) {
  type = type || "i8";
  if (type.charAt(type.length - 1) === "*") type = "i32";
  switch (type) {
    case "i1":
      return HEAP8[ptr >> 0];
    case "i8":
      return HEAP8[ptr >> 0];
    case "i16":
      return HEAP16[ptr >> 1];
    case "i32":
      return HEAP32[ptr >> 2];
    case "i64":
      return HEAP32[ptr >> 2];
    case "float":
      return HEAPF32[ptr >> 2];
    case "double":
      return HEAPF64[ptr >> 3];
    default:
      abort("invalid type for setValue: " + type);
  }
  return null;
}
Module["getValue"] = getValue;
var ALLOC_NORMAL = 0;
var ALLOC_STACK = 1;
var ALLOC_STATIC = 2;
var ALLOC_DYNAMIC = 3;
var ALLOC_NONE = 4;
Module["ALLOC_NORMAL"] = ALLOC_NORMAL;
Module["ALLOC_STACK"] = ALLOC_STACK;
Module["ALLOC_STATIC"] = ALLOC_STATIC;
Module["ALLOC_DYNAMIC"] = ALLOC_DYNAMIC;
Module["ALLOC_NONE"] = ALLOC_NONE;
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === "number") {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }
  var singleType = typeof types === "string" ? types : null;
  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [
      typeof _malloc === "function" ? _malloc : Runtime.staticAlloc,
      Runtime.stackAlloc,
      Runtime.staticAlloc,
      Runtime.dynamicAlloc,
    ][allocator === undefined ? ALLOC_STATIC : allocator](
      Math.max(size, singleType ? 1 : types.length)
    );
  }
  if (zeroinit) {
    var ptr = ret,
      stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[ptr >> 2] = 0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[ptr++ >> 0] = 0;
    }
    return ret;
  }
  if (singleType === "i8") {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(slab, ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }
  var i = 0,
    type,
    typeSize,
    previousType;
  while (i < size) {
    var curr = slab[i];
    if (typeof curr === "function") {
      curr = Runtime.getFunctionIndex(curr);
    }
    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }
    if (type == "i64") type = "i32";
    setValue(ret + i, curr, type);
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }
  return ret;
}
Module["allocate"] = allocate;
function getMemory(size) {
  if (!staticSealed) return Runtime.staticAlloc(size);
  if (!runtimeInitialized) return Runtime.dynamicAlloc(size);
  return _malloc(size);
}
Module["getMemory"] = getMemory;
function Pointer_stringify(ptr, length) {
  if (length === 0 || !ptr) return "";
  var hasUtf = 0;
  var t;
  var i = 0;
  while (1) {
    t = HEAPU8[(ptr + i) >> 0];
    hasUtf |= t;
    if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;
  var ret = "";
  if (hasUtf < 128) {
    var MAX_CHUNK = 1024;
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(
        String,
        HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK))
      );
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }
  return Module["UTF8ToString"](ptr);
}
Module["Pointer_stringify"] = Pointer_stringify;
function AsciiToString(ptr) {
  var str = "";
  while (1) {
    var ch = HEAP8[ptr++ >> 0];
    if (!ch) return str;
    str += String.fromCharCode(ch);
  }
}
Module["AsciiToString"] = AsciiToString;
function stringToAscii(str, outPtr) {
  return writeAsciiToMemory(str, outPtr, false);
}
Module["stringToAscii"] = stringToAscii;
var UTF8Decoder =
  typeof TextDecoder !== "undefined" ? new TextDecoder("utf8") : undefined;
function UTF8ArrayToString(u8Array, idx) {
  var endPtr = idx;
  while (u8Array[endPtr]) ++endPtr;
  if (endPtr - idx > 16 && u8Array.subarray && UTF8Decoder) {
    return UTF8Decoder.decode(u8Array.subarray(idx, endPtr));
  } else {
    var u0, u1, u2, u3, u4, u5;
    var str = "";
    while (1) {
      u0 = u8Array[idx++];
      if (!u0) return str;
      if (!(u0 & 128)) {
        str += String.fromCharCode(u0);
        continue;
      }
      u1 = u8Array[idx++] & 63;
      if ((u0 & 224) == 192) {
        str += String.fromCharCode(((u0 & 31) << 6) | u1);
        continue;
      }
      u2 = u8Array[idx++] & 63;
      if ((u0 & 240) == 224) {
        u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
      } else {
        u3 = u8Array[idx++] & 63;
        if ((u0 & 248) == 240) {
          u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | u3;
        } else {
          u4 = u8Array[idx++] & 63;
          if ((u0 & 252) == 248) {
            u0 = ((u0 & 3) << 24) | (u1 << 18) | (u2 << 12) | (u3 << 6) | u4;
          } else {
            u5 = u8Array[idx++] & 63;
            u0 =
              ((u0 & 1) << 30) |
              (u1 << 24) |
              (u2 << 18) |
              (u3 << 12) |
              (u4 << 6) |
              u5;
          }
        }
      }
      if (u0 < 65536) {
        str += String.fromCharCode(u0);
      } else {
        var ch = u0 - 65536;
        str += String.fromCharCode(55296 | (ch >> 10), 56320 | (ch & 1023));
      }
    }
  }
}
Module["UTF8ArrayToString"] = UTF8ArrayToString;
function UTF8ToString(ptr) {
  return UTF8ArrayToString(HEAPU8, ptr);
}
Module["UTF8ToString"] = UTF8ToString;
function stringToUTF8Array(str, outU8Array, outIdx, maxBytesToWrite) {
  if (!(maxBytesToWrite > 0)) return 0;
  var startIdx = outIdx;
  var endIdx = outIdx + maxBytesToWrite - 1;
  for (var i = 0; i < str.length; ++i) {
    var u = str.charCodeAt(i);
    if (u >= 55296 && u <= 57343)
      u = (65536 + ((u & 1023) << 10)) | (str.charCodeAt(++i) & 1023);
    if (u <= 127) {
      if (outIdx >= endIdx) break;
      outU8Array[outIdx++] = u;
    } else if (u <= 2047) {
      if (outIdx + 1 >= endIdx) break;
      outU8Array[outIdx++] = 192 | (u >> 6);
      outU8Array[outIdx++] = 128 | (u & 63);
    } else if (u <= 65535) {
      if (outIdx + 2 >= endIdx) break;
      outU8Array[outIdx++] = 224 | (u >> 12);
      outU8Array[outIdx++] = 128 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 128 | (u & 63);
    } else if (u <= 2097151) {
      if (outIdx + 3 >= endIdx) break;
      outU8Array[outIdx++] = 240 | (u >> 18);
      outU8Array[outIdx++] = 128 | ((u >> 12) & 63);
      outU8Array[outIdx++] = 128 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 128 | (u & 63);
    } else if (u <= 67108863) {
      if (outIdx + 4 >= endIdx) break;
      outU8Array[outIdx++] = 248 | (u >> 24);
      outU8Array[outIdx++] = 128 | ((u >> 18) & 63);
      outU8Array[outIdx++] = 128 | ((u >> 12) & 63);
      outU8Array[outIdx++] = 128 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 128 | (u & 63);
    } else {
      if (outIdx + 5 >= endIdx) break;
      outU8Array[outIdx++] = 252 | (u >> 30);
      outU8Array[outIdx++] = 128 | ((u >> 24) & 63);
      outU8Array[outIdx++] = 128 | ((u >> 18) & 63);
      outU8Array[outIdx++] = 128 | ((u >> 12) & 63);
      outU8Array[outIdx++] = 128 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 128 | (u & 63);
    }
  }
  outU8Array[outIdx] = 0;
  return outIdx - startIdx;
}
Module["stringToUTF8Array"] = stringToUTF8Array;
function stringToUTF8(str, outPtr, maxBytesToWrite) {
  return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
}
Module["stringToUTF8"] = stringToUTF8;
function lengthBytesUTF8(str) {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    var u = str.charCodeAt(i);
    if (u >= 55296 && u <= 57343)
      u = (65536 + ((u & 1023) << 10)) | (str.charCodeAt(++i) & 1023);
    if (u <= 127) {
      ++len;
    } else if (u <= 2047) {
      len += 2;
    } else if (u <= 65535) {
      len += 3;
    } else if (u <= 2097151) {
      len += 4;
    } else if (u <= 67108863) {
      len += 5;
    } else {
      len += 6;
    }
  }
  return len;
}
Module["lengthBytesUTF8"] = lengthBytesUTF8;
var UTF16Decoder =
  typeof TextDecoder !== "undefined" ? new TextDecoder("utf-16le") : undefined;
function demangle(func) {
  var __cxa_demangle_func =
    Module["___cxa_demangle"] || Module["__cxa_demangle"];
  if (__cxa_demangle_func) {
    try {
      var s = func.substr(1);
      var len = lengthBytesUTF8(s) + 1;
      var buf = _malloc(len);
      stringToUTF8(s, buf, len);
      var status = _malloc(4);
      var ret = __cxa_demangle_func(buf, 0, 0, status);
      if (getValue(status, "i32") === 0 && ret) {
        return Pointer_stringify(ret);
      }
    } catch (e) {
    } finally {
      if (buf) _free(buf);
      if (status) _free(status);
      if (ret) _free(ret);
    }
    return func;
  }
  Runtime.warnOnce(
    "warning: build with  -s DEMANGLE_SUPPORT=1  to link in libcxxabi demangling"
  );
  return func;
}
function demangleAll(text) {
  var regex = /__Z[\w\d_]+/g;
  return text.replace(regex, function (x) {
    var y = demangle(x);
    return x === y ? x : x + " [" + y + "]";
  });
}
function jsStackTrace() {
  var err = new Error();
  if (!err.stack) {
    try {
      throw new Error(0);
    } catch (e) {
      err = e;
    }
    if (!err.stack) {
      return "(no stack trace available)";
    }
  }
  return err.stack.toString();
}
function stackTrace() {
  var js = jsStackTrace();
  if (Module["extraStackTrace"]) js += "\n" + Module["extraStackTrace"]();
  return demangleAll(js);
}
Module["stackTrace"] = stackTrace;
var WASM_PAGE_SIZE = 65536;
var ASMJS_PAGE_SIZE = 16777216;
var MIN_TOTAL_MEMORY = 16777216;
function alignUp(x, multiple) {
  if (x % multiple > 0) {
    x += multiple - (x % multiple);
  }
  return x;
}
var HEAP,
  buffer,
  HEAP8,
  HEAPU8,
  HEAP16,
  HEAPU16,
  HEAP32,
  HEAPU32,
  HEAPF32,
  HEAPF64;
function updateGlobalBuffer(buf) {
  Module["buffer"] = buffer = buf;
}
function updateGlobalBufferViews() {
  Module["HEAP8"] = HEAP8 = new Int8Array(buffer);
  Module["HEAP16"] = HEAP16 = new Int16Array(buffer);
  Module["HEAP32"] = HEAP32 = new Int32Array(buffer);
  Module["HEAPU8"] = HEAPU8 = new Uint8Array(buffer);
  Module["HEAPU16"] = HEAPU16 = new Uint16Array(buffer);
  Module["HEAPU32"] = HEAPU32 = new Uint32Array(buffer);
  Module["HEAPF32"] = HEAPF32 = new Float32Array(buffer);
  Module["HEAPF64"] = HEAPF64 = new Float64Array(buffer);
}
var STATIC_BASE, STATICTOP, staticSealed;
var STACK_BASE, STACKTOP, STACK_MAX;
var DYNAMIC_BASE, DYNAMICTOP_PTR;
STATIC_BASE =
  STATICTOP =
  STACK_BASE =
  STACKTOP =
  STACK_MAX =
  DYNAMIC_BASE =
  DYNAMICTOP_PTR =
    0;
staticSealed = false;
function abortOnCannotGrowMemory() {
  abort(
    "Cannot enlarge memory arrays. Either (1) compile with  -s TOTAL_MEMORY=X  with X higher than the current value " +
      TOTAL_MEMORY +
      ", (2) compile with  -s ALLOW_MEMORY_GROWTH=1  which allows increasing the size at runtime but prevents some optimizations, (3) set Module.TOTAL_MEMORY to a higher value before the program runs, or (4) if you want malloc to return NULL (0) instead of this abort, compile with  -s ABORTING_MALLOC=0 "
  );
}
if (!Module["reallocBuffer"])
  Module["reallocBuffer"] = function (size) {
    var ret;
    try {
      if (ArrayBuffer.transfer) {
        ret = ArrayBuffer.transfer(buffer, size);
      } else {
        var oldHEAP8 = HEAP8;
        ret = new ArrayBuffer(size);
        var temp = new Int8Array(ret);
        temp.set(oldHEAP8);
      }
    } catch (e) {
      return false;
    }
    var success = _emscripten_replace_memory(ret);
    if (!success) return false;
    return ret;
  };
function enlargeMemory() {
  var PAGE_MULTIPLE = Module["usingWasm"] ? WASM_PAGE_SIZE : ASMJS_PAGE_SIZE;
  var LIMIT = 2147483648 - PAGE_MULTIPLE;
  if (HEAP32[DYNAMICTOP_PTR >> 2] > LIMIT) {
    return false;
  }
  var OLD_TOTAL_MEMORY = TOTAL_MEMORY;
  TOTAL_MEMORY = Math.max(TOTAL_MEMORY, MIN_TOTAL_MEMORY);
  while (TOTAL_MEMORY < HEAP32[DYNAMICTOP_PTR >> 2]) {
    if (TOTAL_MEMORY <= 536870912) {
      TOTAL_MEMORY = alignUp(2 * TOTAL_MEMORY, PAGE_MULTIPLE);
    } else {
      TOTAL_MEMORY = Math.min(
        alignUp((3 * TOTAL_MEMORY + 2147483648) / 4, PAGE_MULTIPLE),
        LIMIT
      );
    }
  }
  var replacement = Module["reallocBuffer"](TOTAL_MEMORY);
  if (!replacement || replacement.byteLength != TOTAL_MEMORY) {
    TOTAL_MEMORY = OLD_TOTAL_MEMORY;
    return false;
  }
  updateGlobalBuffer(replacement);
  updateGlobalBufferViews();
  return true;
}
var byteLength;
try {
  byteLength = Function.prototype.call.bind(
    Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, "byteLength").get
  );
  byteLength(new ArrayBuffer(4));
} catch (e) {
  byteLength = function (buffer) {
    return buffer.byteLength;
  };
}
var TOTAL_STACK = Module["TOTAL_STACK"] || 5242880;
var TOTAL_MEMORY = Module["TOTAL_MEMORY"] || 16777216;
if (TOTAL_MEMORY < TOTAL_STACK)
  Module.printErr(
    "TOTAL_MEMORY should be larger than TOTAL_STACK, was " +
      TOTAL_MEMORY +
      "! (TOTAL_STACK=" +
      TOTAL_STACK +
      ")"
  );
if (Module["buffer"]) {
  buffer = Module["buffer"];
} else {
  {
    buffer = new ArrayBuffer(TOTAL_MEMORY);
  }
}
updateGlobalBufferViews();
function getTotalMemory() {
  return TOTAL_MEMORY;
}
HEAP32[0] = 1668509029;
HEAP16[1] = 25459;
if (HEAPU8[2] !== 115 || HEAPU8[3] !== 99)
  throw "Runtime error: expected the system to be little-endian!";
Module["HEAP"] = HEAP;
Module["buffer"] = buffer;
Module["HEAP8"] = HEAP8;
Module["HEAP16"] = HEAP16;
Module["HEAP32"] = HEAP32;
Module["HEAPU8"] = HEAPU8;
Module["HEAPU16"] = HEAPU16;
Module["HEAPU32"] = HEAPU32;
Module["HEAPF32"] = HEAPF32;
Module["HEAPF64"] = HEAPF64;
function callRuntimeCallbacks(callbacks) {
  while (callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == "function") {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === "number") {
      if (callback.arg === undefined) {
        Module["dynCall_v"](func);
      } else {
        Module["dynCall_vi"](func, callback.arg);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}
var __ATPRERUN__ = [];
var __ATINIT__ = [];
var __ATMAIN__ = [];
var __ATEXIT__ = [];
var __ATPOSTRUN__ = [];
var runtimeInitialized = false;
var runtimeExited = false;
function preRun() {
  if (Module["preRun"]) {
    if (typeof Module["preRun"] == "function")
      Module["preRun"] = [Module["preRun"]];
    while (Module["preRun"].length) {
      addOnPreRun(Module["preRun"].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}
function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}
function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}
function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
  runtimeExited = true;
}
function postRun() {
  if (Module["postRun"]) {
    if (typeof Module["postRun"] == "function")
      Module["postRun"] = [Module["postRun"]];
    while (Module["postRun"].length) {
      addOnPostRun(Module["postRun"].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}
function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
Module["addOnPreRun"] = addOnPreRun;
function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
Module["addOnInit"] = addOnInit;
function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}
Module["addOnPreMain"] = addOnPreMain;
function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}
Module["addOnExit"] = addOnExit;
function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
Module["addOnPostRun"] = addOnPostRun;
function intArrayFromString(stringy, dontAddNull, length) {
  var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
  var u8array = new Array(len);
  var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
  if (dontAddNull) u8array.length = numBytesWritten;
  return u8array;
}
Module["intArrayFromString"] = intArrayFromString;
function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 255) {
      chr &= 255;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join("");
}
Module["intArrayToString"] = intArrayToString;
function writeStringToMemory(string, buffer, dontAddNull) {
  Runtime.warnOnce(
    "writeStringToMemory is deprecated and should not be called! Use stringToUTF8() instead!"
  );
  var lastChar, end;
  if (dontAddNull) {
    end = buffer + lengthBytesUTF8(string);
    lastChar = HEAP8[end];
  }
  stringToUTF8(string, buffer, Infinity);
  if (dontAddNull) HEAP8[end] = lastChar;
}
Module["writeStringToMemory"] = writeStringToMemory;
function writeArrayToMemory(array, buffer) {
  HEAP8.set(array, buffer);
}
Module["writeArrayToMemory"] = writeArrayToMemory;
function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; ++i) {
    HEAP8[buffer++ >> 0] = str.charCodeAt(i);
  }
  if (!dontAddNull) HEAP8[buffer >> 0] = 0;
}
Module["writeAsciiToMemory"] = writeAsciiToMemory;
if (!Math["imul"] || Math["imul"](4294967295, 5) !== -5)
  Math["imul"] = function imul(a, b) {
    var ah = a >>> 16;
    var al = a & 65535;
    var bh = b >>> 16;
    var bl = b & 65535;
    return (al * bl + ((ah * bl + al * bh) << 16)) | 0;
  };
Math.imul = Math["imul"];
if (!Math["clz32"])
  Math["clz32"] = function (x) {
    x = x >>> 0;
    for (var i = 0; i < 32; i++) {
      if (x & (1 << (31 - i))) return i;
    }
    return 32;
  };
Math.clz32 = Math["clz32"];
if (!Math["trunc"])
  Math["trunc"] = function (x) {
    return x < 0 ? Math.ceil(x) : Math.floor(x);
  };
Math.trunc = Math["trunc"];
var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_round = Math.round;
var Math_min = Math.min;
var Math_clz32 = Math.clz32;
var Math_trunc = Math.trunc;
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null;
function addRunDependency(id) {
  runDependencies++;
  if (Module["monitorRunDependencies"]) {
    Module["monitorRunDependencies"](runDependencies);
  }
}
Module["addRunDependency"] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module["monitorRunDependencies"]) {
    Module["monitorRunDependencies"](runDependencies);
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback();
    }
  }
}
Module["removeRunDependency"] = removeRunDependency;
Module["preloadedImages"] = {};
Module["preloadedAudios"] = {};
var ASM_CONSTS = [];
STATIC_BASE = Runtime.GLOBAL_BASE;
STATICTOP = STATIC_BASE + 8624;
__ATINIT__.push();
allocate(
  [
    116, 2, 0, 0, 148, 2, 0, 0, 24, 0, 0, 0, 0, 0, 0, 0, 76, 2, 0, 0, 170, 2, 0,
    0, 116, 2, 0, 0, 190, 2, 0, 0, 24, 0, 0, 0, 0, 0, 0, 0, 116, 2, 0, 0, 209,
    26, 0, 0, 24, 0, 0, 0, 0, 0, 0, 0, 116, 2, 0, 0, 63, 27, 0, 0, 80, 0, 0, 0,
    0, 0, 0, 0, 116, 2, 0, 0, 236, 26, 0, 0, 96, 0, 0, 0, 0, 0, 0, 0, 76, 2, 0,
    0, 13, 27, 0, 0, 116, 2, 0, 0, 26, 27, 0, 0, 64, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 8, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 24, 0, 0, 0, 1, 0, 0,
    0, 1, 0, 0, 0, 0, 0, 0, 0, 32, 0, 0, 0, 3, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0,
    48, 0, 0, 0, 5, 0, 0, 0, 6, 0, 0, 0, 209, 2, 0, 0, 209, 8, 0, 0, 209, 2, 0,
    0, 209, 14, 0, 0, 209, 20, 0, 0, 209, 14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 128, 29, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0,
    0, 2, 0, 0, 0, 172, 29, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 255, 255, 255, 255, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 196, 1, 0, 0, 0, 0, 0, 0, 64, 0,
    0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0, 4, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0,
    0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 104, 0, 0, 0, 1, 0, 0, 0, 5, 0, 0, 0,
    3, 0, 0, 0, 4, 0, 0, 0, 3, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 78,
    54, 115, 113, 117, 105, 115, 104, 49, 48, 67, 108, 117, 115, 116, 101, 114,
    70, 105, 116, 69, 0, 78, 54, 115, 113, 117, 105, 115, 104, 57, 67, 111, 108,
    111, 117, 114, 70, 105, 116, 69, 0, 78, 54, 115, 113, 117, 105, 115, 104,
    56, 82, 97, 110, 103, 101, 70, 105, 116, 69, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
    0, 1, 1, 0, 0, 2, 0, 1, 0, 0, 0, 3, 0, 1, 1, 0, 0, 4, 0, 2, 1, 1, 0, 3, 0,
    2, 0, 1, 0, 2, 0, 2, 1, 1, 0, 1, 0, 3, 1, 1, 0, 0, 0, 3, 0, 1, 0, 1, 1, 2,
    1, 1, 0, 2, 1, 2, 0, 1, 0, 3, 0, 4, 0, 1, 0, 4, 0, 5, 1, 2, 0, 3, 0, 5, 0,
    2, 0, 2, 0, 5, 1, 2, 0, 1, 0, 6, 1, 2, 0, 0, 0, 6, 0, 2, 0, 1, 2, 3, 1, 2,
    0, 2, 2, 3, 0, 2, 0, 3, 0, 7, 0, 2, 0, 4, 1, 6, 1, 3, 0, 3, 1, 6, 0, 3, 0,
    2, 0, 8, 0, 3, 0, 1, 0, 9, 1, 3, 0, 0, 0, 9, 0, 3, 0, 1, 0, 9, 1, 3, 0, 2,
    0, 10, 1, 3, 0, 3, 0, 10, 0, 3, 0, 4, 2, 7, 1, 4, 0, 4, 2, 7, 0, 4, 0, 3, 0,
    11, 0, 4, 0, 2, 1, 10, 1, 4, 0, 1, 1, 10, 0, 4, 0, 0, 0, 12, 0, 4, 0, 1, 0,
    13, 1, 4, 0, 2, 0, 13, 0, 4, 0, 3, 0, 13, 1, 4, 0, 4, 0, 14, 1, 5, 0, 3, 0,
    14, 0, 5, 0, 2, 2, 11, 1, 5, 0, 1, 2, 11, 0, 5, 0, 0, 0, 15, 0, 5, 0, 1, 1,
    14, 1, 5, 0, 2, 1, 14, 0, 5, 0, 3, 0, 16, 0, 5, 0, 4, 0, 17, 1, 6, 0, 3, 0,
    17, 0, 6, 0, 2, 0, 17, 1, 6, 0, 1, 0, 18, 1, 6, 0, 0, 0, 18, 0, 6, 0, 1, 2,
    15, 1, 6, 0, 2, 2, 15, 0, 6, 0, 3, 0, 19, 0, 6, 0, 4, 1, 18, 1, 7, 0, 3, 1,
    18, 0, 7, 0, 2, 0, 20, 0, 7, 0, 1, 0, 21, 1, 7, 0, 0, 0, 21, 0, 7, 0, 1, 0,
    21, 1, 7, 0, 2, 0, 22, 1, 7, 0, 3, 0, 22, 0, 7, 0, 4, 2, 19, 1, 8, 0, 4, 2,
    19, 0, 8, 0, 3, 0, 23, 0, 8, 0, 2, 1, 22, 1, 8, 0, 1, 1, 22, 0, 8, 0, 0, 0,
    24, 0, 8, 0, 1, 0, 25, 1, 8, 0, 2, 0, 25, 0, 8, 0, 3, 0, 25, 1, 8, 0, 4, 0,
    26, 1, 9, 0, 3, 0, 26, 0, 9, 0, 2, 2, 23, 1, 9, 0, 1, 2, 23, 0, 9, 0, 0, 0,
    27, 0, 9, 0, 1, 1, 26, 1, 9, 0, 2, 1, 26, 0, 9, 0, 3, 0, 28, 0, 9, 0, 4, 0,
    29, 1, 10, 0, 3, 0, 29, 0, 10, 0, 2, 0, 29, 1, 10, 0, 1, 0, 30, 1, 10, 0, 0,
    0, 30, 0, 10, 0, 1, 2, 27, 1, 10, 0, 2, 2, 27, 0, 10, 0, 3, 0, 31, 0, 10, 0,
    4, 1, 30, 1, 11, 0, 3, 1, 30, 0, 11, 0, 2, 4, 24, 0, 11, 0, 1, 1, 31, 1, 11,
    0, 0, 1, 31, 0, 11, 0, 1, 1, 31, 1, 11, 0, 2, 2, 30, 1, 11, 0, 3, 2, 30, 0,
    11, 0, 4, 2, 31, 1, 12, 0, 4, 2, 31, 0, 12, 0, 3, 4, 27, 0, 12, 0, 2, 3, 30,
    1, 12, 0, 1, 3, 30, 0, 12, 0, 0, 4, 28, 0, 12, 0, 1, 3, 31, 1, 12, 0, 2, 3,
    31, 0, 12, 0, 3, 3, 31, 1, 12, 0, 4, 4, 30, 1, 13, 0, 3, 4, 30, 0, 13, 0, 2,
    6, 27, 1, 13, 0, 1, 6, 27, 0, 13, 0, 0, 4, 31, 0, 13, 0, 1, 5, 30, 1, 13, 0,
    2, 5, 30, 0, 13, 0, 3, 8, 24, 0, 13, 0, 4, 5, 31, 1, 14, 0, 3, 5, 31, 0, 14,
    0, 2, 5, 31, 1, 14, 0, 1, 6, 30, 1, 14, 0, 0, 6, 30, 0, 14, 0, 1, 6, 31, 1,
    14, 0, 2, 6, 31, 0, 14, 0, 3, 8, 27, 0, 14, 0, 4, 7, 30, 1, 15, 0, 3, 7, 30,
    0, 15, 0, 2, 8, 28, 0, 15, 0, 1, 7, 31, 1, 15, 0, 0, 7, 31, 0, 15, 0, 1, 7,
    31, 1, 15, 0, 2, 8, 30, 1, 15, 0, 3, 8, 30, 0, 15, 0, 4, 10, 27, 1, 16, 0,
    4, 10, 27, 0, 16, 0, 3, 8, 31, 0, 16, 0, 2, 9, 30, 1, 16, 0, 1, 9, 30, 0,
    16, 0, 0, 12, 24, 0, 16, 0, 1, 9, 31, 1, 16, 0, 2, 9, 31, 0, 16, 0, 3, 9,
    31, 1, 16, 0, 4, 10, 30, 1, 17, 0, 3, 10, 30, 0, 17, 0, 2, 10, 31, 1, 17, 0,
    1, 10, 31, 0, 17, 0, 0, 12, 27, 0, 17, 0, 1, 11, 30, 1, 17, 0, 2, 11, 30, 0,
    17, 0, 3, 12, 28, 0, 17, 0, 4, 11, 31, 1, 18, 0, 3, 11, 31, 0, 18, 0, 2, 11,
    31, 1, 18, 0, 1, 12, 30, 1, 18, 0, 0, 12, 30, 0, 18, 0, 1, 14, 27, 1, 18, 0,
    2, 14, 27, 0, 18, 0, 3, 12, 31, 0, 18, 0, 4, 13, 30, 1, 19, 0, 3, 13, 30, 0,
    19, 0, 2, 16, 24, 0, 19, 0, 1, 13, 31, 1, 19, 0, 0, 13, 31, 0, 19, 0, 1, 13,
    31, 1, 19, 0, 2, 14, 30, 1, 19, 0, 3, 14, 30, 0, 19, 0, 4, 14, 31, 1, 20, 0,
    4, 14, 31, 0, 20, 0, 3, 16, 27, 0, 20, 0, 2, 15, 30, 1, 20, 0, 1, 15, 30, 0,
    20, 0, 0, 16, 28, 0, 20, 0, 1, 15, 31, 1, 20, 0, 2, 15, 31, 0, 20, 0, 3, 15,
    31, 1, 20, 0, 4, 16, 30, 1, 21, 0, 3, 16, 30, 0, 21, 0, 2, 18, 27, 1, 21, 0,
    1, 18, 27, 0, 21, 0, 0, 16, 31, 0, 21, 0, 1, 17, 30, 1, 21, 0, 2, 17, 30, 0,
    21, 0, 3, 20, 24, 0, 21, 0, 4, 17, 31, 1, 22, 0, 3, 17, 31, 0, 22, 0, 2, 17,
    31, 1, 22, 0, 1, 18, 30, 1, 22, 0, 0, 18, 30, 0, 22, 0, 1, 18, 31, 1, 22, 0,
    2, 18, 31, 0, 22, 0, 3, 20, 27, 0, 22, 0, 4, 19, 30, 1, 23, 0, 3, 19, 30, 0,
    23, 0, 2, 20, 28, 0, 23, 0, 1, 19, 31, 1, 23, 0, 0, 19, 31, 0, 23, 0, 1, 19,
    31, 1, 23, 0, 2, 20, 30, 1, 23, 0, 3, 20, 30, 0, 23, 0, 4, 22, 27, 1, 24, 0,
    4, 22, 27, 0, 24, 0, 3, 20, 31, 0, 24, 0, 2, 21, 30, 1, 24, 0, 1, 21, 30, 0,
    24, 0, 0, 24, 24, 0, 24, 0, 1, 21, 31, 1, 24, 0, 2, 21, 31, 0, 24, 0, 3, 21,
    31, 1, 24, 0, 4, 22, 30, 1, 25, 0, 3, 22, 30, 0, 25, 0, 2, 22, 31, 1, 25, 0,
    1, 22, 31, 0, 25, 0, 0, 24, 27, 0, 25, 0, 1, 23, 30, 1, 25, 0, 2, 23, 30, 0,
    25, 0, 3, 24, 28, 0, 25, 0, 4, 23, 31, 1, 26, 0, 3, 23, 31, 0, 26, 0, 2, 23,
    31, 1, 26, 0, 1, 24, 30, 1, 26, 0, 0, 24, 30, 0, 26, 0, 1, 26, 27, 1, 26, 0,
    2, 26, 27, 0, 26, 0, 3, 24, 31, 0, 26, 0, 4, 25, 30, 1, 27, 0, 3, 25, 30, 0,
    27, 0, 2, 28, 24, 0, 27, 0, 1, 25, 31, 1, 27, 0, 0, 25, 31, 0, 27, 0, 1, 25,
    31, 1, 27, 0, 2, 26, 30, 1, 27, 0, 3, 26, 30, 0, 27, 0, 4, 26, 31, 1, 28, 0,
    4, 26, 31, 0, 28, 0, 3, 28, 27, 0, 28, 0, 2, 27, 30, 1, 28, 0, 1, 27, 30, 0,
    28, 0, 0, 28, 28, 0, 28, 0, 1, 27, 31, 1, 28, 0, 2, 27, 31, 0, 28, 0, 3, 27,
    31, 1, 28, 0, 4, 28, 30, 1, 29, 0, 3, 28, 30, 0, 29, 0, 2, 30, 27, 1, 29, 0,
    1, 30, 27, 0, 29, 0, 0, 28, 31, 0, 29, 0, 1, 29, 30, 1, 29, 0, 2, 29, 30, 0,
    29, 0, 3, 29, 30, 1, 29, 0, 4, 29, 31, 1, 30, 0, 3, 29, 31, 0, 30, 0, 2, 29,
    31, 1, 30, 0, 1, 30, 30, 1, 30, 0, 0, 30, 30, 0, 30, 0, 1, 30, 31, 1, 30, 0,
    2, 30, 31, 0, 30, 0, 3, 30, 31, 1, 30, 0, 4, 31, 30, 1, 31, 0, 3, 31, 30, 0,
    31, 0, 2, 31, 30, 1, 31, 0, 1, 31, 31, 1, 31, 0, 0, 31, 31, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 2, 0, 2, 0, 1, 0, 1, 0, 3, 1, 1, 0, 0, 0, 3,
    0, 1, 0, 1, 0, 4, 0, 1, 0, 2, 0, 5, 0, 2, 0, 1, 0, 6, 1, 2, 0, 0, 0, 6, 0,
    2, 0, 1, 0, 7, 0, 2, 0, 2, 0, 8, 0, 3, 0, 1, 0, 9, 1, 3, 0, 0, 0, 9, 0, 3,
    0, 1, 0, 10, 0, 3, 0, 2, 0, 11, 0, 4, 0, 1, 0, 12, 1, 4, 0, 0, 0, 12, 0, 4,
    0, 1, 0, 13, 0, 4, 0, 2, 0, 14, 0, 5, 0, 1, 0, 15, 1, 5, 0, 0, 0, 15, 0, 5,
    0, 1, 0, 16, 0, 5, 0, 2, 1, 15, 0, 6, 0, 1, 0, 17, 0, 6, 0, 0, 0, 18, 0, 6,
    0, 1, 0, 19, 0, 6, 0, 2, 3, 14, 0, 7, 0, 1, 0, 20, 0, 7, 0, 0, 0, 21, 0, 7,
    0, 1, 0, 22, 0, 7, 0, 2, 4, 15, 0, 8, 0, 1, 0, 23, 0, 8, 0, 0, 0, 24, 0, 8,
    0, 1, 0, 25, 0, 8, 0, 2, 6, 14, 0, 9, 0, 1, 0, 26, 0, 9, 0, 0, 0, 27, 0, 9,
    0, 1, 0, 28, 0, 9, 0, 2, 7, 15, 0, 10, 0, 1, 0, 29, 0, 10, 0, 0, 0, 30, 0,
    10, 0, 1, 0, 31, 0, 10, 0, 2, 9, 14, 0, 11, 0, 1, 0, 32, 0, 11, 0, 0, 0, 33,
    0, 11, 0, 1, 2, 30, 0, 11, 0, 2, 0, 34, 0, 12, 0, 1, 0, 35, 0, 12, 0, 0, 0,
    36, 0, 12, 0, 1, 3, 31, 0, 12, 0, 2, 0, 37, 0, 13, 0, 1, 0, 38, 0, 13, 0, 0,
    0, 39, 0, 13, 0, 1, 5, 30, 0, 13, 0, 2, 0, 40, 0, 14, 0, 1, 0, 41, 0, 14, 0,
    0, 0, 42, 0, 14, 0, 1, 6, 31, 0, 14, 0, 2, 0, 43, 0, 15, 0, 1, 0, 44, 0, 15,
    0, 0, 0, 45, 0, 15, 0, 1, 8, 30, 0, 15, 0, 2, 0, 46, 0, 16, 0, 2, 0, 47, 0,
    16, 0, 1, 1, 46, 0, 16, 0, 0, 0, 48, 0, 16, 0, 1, 0, 49, 0, 16, 0, 2, 0, 50,
    0, 17, 0, 1, 2, 47, 0, 17, 0, 0, 0, 51, 0, 17, 0, 1, 0, 52, 0, 17, 0, 2, 0,
    53, 0, 18, 0, 1, 4, 46, 0, 18, 0, 0, 0, 54, 0, 18, 0, 1, 0, 55, 0, 18, 0, 2,
    0, 56, 0, 19, 0, 1, 5, 47, 0, 19, 0, 0, 0, 57, 0, 19, 0, 1, 0, 58, 0, 19, 0,
    2, 0, 59, 0, 20, 0, 1, 7, 46, 0, 20, 0, 0, 0, 60, 0, 20, 0, 1, 0, 61, 0, 20,
    0, 2, 0, 62, 0, 21, 0, 1, 8, 47, 0, 21, 0, 0, 0, 63, 0, 21, 0, 1, 1, 62, 0,
    21, 0, 2, 1, 63, 0, 22, 0, 1, 10, 46, 0, 22, 0, 0, 2, 62, 0, 22, 0, 1, 2,
    63, 0, 22, 0, 2, 3, 62, 0, 23, 0, 1, 11, 47, 0, 23, 0, 0, 3, 63, 0, 23, 0,
    1, 4, 62, 0, 23, 0, 2, 4, 63, 0, 24, 0, 1, 13, 46, 0, 24, 0, 0, 5, 62, 0,
    24, 0, 1, 5, 63, 0, 24, 0, 2, 6, 62, 0, 25, 0, 1, 14, 47, 0, 25, 0, 0, 6,
    63, 0, 25, 0, 1, 7, 62, 0, 25, 0, 2, 7, 63, 0, 26, 0, 1, 16, 45, 0, 26, 0,
    0, 8, 62, 0, 26, 0, 1, 8, 63, 0, 26, 0, 2, 9, 62, 0, 27, 0, 1, 16, 48, 0,
    27, 0, 0, 9, 63, 0, 27, 0, 1, 10, 62, 0, 27, 0, 2, 10, 63, 0, 28, 0, 1, 16,
    51, 0, 28, 0, 0, 11, 62, 0, 28, 0, 1, 11, 63, 0, 28, 0, 2, 12, 62, 0, 29, 0,
    1, 16, 54, 0, 29, 0, 0, 12, 63, 0, 29, 0, 1, 13, 62, 0, 29, 0, 2, 13, 63, 0,
    30, 0, 1, 16, 57, 0, 30, 0, 0, 14, 62, 0, 30, 0, 1, 14, 63, 0, 30, 0, 2, 15,
    62, 0, 31, 0, 1, 16, 60, 0, 31, 0, 0, 15, 63, 0, 31, 0, 1, 24, 46, 0, 31, 0,
    2, 16, 62, 0, 32, 0, 2, 16, 63, 0, 32, 0, 1, 17, 62, 0, 32, 0, 0, 25, 47, 0,
    32, 0, 1, 17, 63, 0, 32, 0, 2, 18, 62, 0, 33, 0, 1, 18, 63, 0, 33, 0, 0, 27,
    46, 0, 33, 0, 1, 19, 62, 0, 33, 0, 2, 19, 63, 0, 34, 0, 1, 20, 62, 0, 34, 0,
    0, 28, 47, 0, 34, 0, 1, 20, 63, 0, 34, 0, 2, 21, 62, 0, 35, 0, 1, 21, 63, 0,
    35, 0, 0, 30, 46, 0, 35, 0, 1, 22, 62, 0, 35, 0, 2, 22, 63, 0, 36, 0, 1, 23,
    62, 0, 36, 0, 0, 31, 47, 0, 36, 0, 1, 23, 63, 0, 36, 0, 2, 24, 62, 0, 37, 0,
    1, 24, 63, 0, 37, 0, 0, 32, 47, 0, 37, 0, 1, 25, 62, 0, 37, 0, 2, 25, 63, 0,
    38, 0, 1, 26, 62, 0, 38, 0, 0, 32, 50, 0, 38, 0, 1, 26, 63, 0, 38, 0, 2, 27,
    62, 0, 39, 0, 1, 27, 63, 0, 39, 0, 0, 32, 53, 0, 39, 0, 1, 28, 62, 0, 39, 0,
    2, 28, 63, 0, 40, 0, 1, 29, 62, 0, 40, 0, 0, 32, 56, 0, 40, 0, 1, 29, 63, 0,
    40, 0, 2, 30, 62, 0, 41, 0, 1, 30, 63, 0, 41, 0, 0, 32, 59, 0, 41, 0, 1, 31,
    62, 0, 41, 0, 2, 31, 63, 0, 42, 0, 1, 32, 61, 0, 42, 0, 0, 32, 62, 0, 42, 0,
    1, 32, 63, 0, 42, 0, 2, 41, 46, 0, 43, 0, 1, 33, 62, 0, 43, 0, 0, 33, 63, 0,
    43, 0, 1, 34, 62, 0, 43, 0, 2, 42, 47, 0, 44, 0, 1, 34, 63, 0, 44, 0, 0, 35,
    62, 0, 44, 0, 1, 35, 63, 0, 44, 0, 2, 44, 46, 0, 45, 0, 1, 36, 62, 0, 45, 0,
    0, 36, 63, 0, 45, 0, 1, 37, 62, 0, 45, 0, 2, 45, 47, 0, 46, 0, 1, 37, 63, 0,
    46, 0, 0, 38, 62, 0, 46, 0, 1, 38, 63, 0, 46, 0, 2, 47, 46, 0, 47, 0, 1, 39,
    62, 0, 47, 0, 0, 39, 63, 0, 47, 0, 1, 40, 62, 0, 47, 0, 2, 48, 46, 0, 48, 0,
    2, 40, 63, 0, 48, 0, 1, 41, 62, 0, 48, 0, 0, 41, 63, 0, 48, 0, 1, 48, 49, 0,
    48, 0, 2, 42, 62, 0, 49, 0, 1, 42, 63, 0, 49, 0, 0, 43, 62, 0, 49, 0, 1, 48,
    52, 0, 49, 0, 2, 43, 63, 0, 50, 0, 1, 44, 62, 0, 50, 0, 0, 44, 63, 0, 50, 0,
    1, 48, 55, 0, 50, 0, 2, 45, 62, 0, 51, 0, 1, 45, 63, 0, 51, 0, 0, 46, 62, 0,
    51, 0, 1, 48, 58, 0, 51, 0, 2, 46, 63, 0, 52, 0, 1, 47, 62, 0, 52, 0, 0, 47,
    63, 0, 52, 0, 1, 48, 61, 0, 52, 0, 2, 48, 62, 0, 53, 0, 1, 56, 47, 0, 53, 0,
    0, 48, 63, 0, 53, 0, 1, 49, 62, 0, 53, 0, 2, 49, 63, 0, 54, 0, 1, 58, 46, 0,
    54, 0, 0, 50, 62, 0, 54, 0, 1, 50, 63, 0, 54, 0, 2, 51, 62, 0, 55, 0, 1, 59,
    47, 0, 55, 0, 0, 51, 63, 0, 55, 0, 1, 52, 62, 0, 55, 0, 2, 52, 63, 0, 56, 0,
    1, 61, 46, 0, 56, 0, 0, 53, 62, 0, 56, 0, 1, 53, 63, 0, 56, 0, 2, 54, 62, 0,
    57, 0, 1, 62, 47, 0, 57, 0, 0, 54, 63, 0, 57, 0, 1, 55, 62, 0, 57, 0, 2, 55,
    63, 0, 58, 0, 1, 56, 62, 1, 58, 0, 0, 56, 62, 0, 58, 0, 1, 56, 63, 0, 58, 0,
    2, 57, 62, 0, 59, 0, 1, 57, 63, 1, 59, 0, 0, 57, 63, 0, 59, 0, 1, 58, 62, 0,
    59, 0, 2, 58, 63, 0, 60, 0, 1, 59, 62, 1, 60, 0, 0, 59, 62, 0, 60, 0, 1, 59,
    63, 0, 60, 0, 2, 60, 62, 0, 61, 0, 1, 60, 63, 1, 61, 0, 0, 60, 63, 0, 61, 0,
    1, 61, 62, 0, 61, 0, 2, 61, 63, 0, 62, 0, 1, 62, 62, 1, 62, 0, 0, 62, 62, 0,
    62, 0, 1, 62, 63, 0, 62, 0, 2, 63, 62, 0, 63, 0, 1, 63, 63, 1, 63, 0, 0, 63,
    63, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 2, 0, 0, 2, 0, 0, 3, 0, 1,
    1, 0, 0, 4, 0, 1, 0, 1, 0, 3, 0, 1, 1, 1, 0, 2, 0, 1, 2, 1, 0, 1, 0, 2, 1,
    1, 0, 0, 0, 2, 0, 1, 0, 1, 0, 2, 1, 1, 0, 2, 0, 2, 2, 1, 0, 3, 0, 3, 1, 1,
    0, 4, 0, 3, 0, 2, 0, 3, 0, 3, 1, 2, 0, 2, 0, 3, 2, 2, 0, 1, 0, 4, 1, 2, 0,
    0, 0, 4, 0, 2, 0, 1, 0, 4, 1, 2, 0, 2, 0, 4, 2, 2, 0, 3, 0, 5, 1, 2, 0, 4,
    0, 5, 0, 3, 0, 3, 0, 5, 1, 3, 0, 2, 0, 5, 2, 3, 0, 1, 0, 6, 1, 3, 0, 0, 0,
    6, 0, 3, 0, 1, 0, 6, 1, 3, 0, 2, 0, 6, 2, 3, 0, 3, 0, 7, 1, 3, 0, 4, 0, 7,
    0, 4, 0, 4, 0, 7, 1, 4, 0, 3, 0, 7, 2, 4, 0, 2, 1, 7, 1, 4, 0, 1, 1, 7, 0,
    4, 0, 0, 0, 8, 0, 4, 0, 1, 0, 8, 1, 4, 0, 2, 2, 7, 1, 4, 0, 3, 2, 7, 0, 4,
    0, 4, 0, 9, 0, 5, 0, 3, 0, 9, 1, 5, 0, 2, 3, 7, 1, 5, 0, 1, 3, 7, 0, 5, 0,
    0, 0, 10, 0, 5, 0, 1, 0, 10, 1, 5, 0, 2, 0, 10, 2, 5, 0, 3, 0, 11, 1, 5, 0,
    4, 0, 11, 0, 6, 0, 3, 0, 11, 1, 6, 0, 2, 0, 11, 2, 6, 0, 1, 0, 12, 1, 6, 0,
    0, 0, 12, 0, 6, 0, 1, 0, 12, 1, 6, 0, 2, 0, 12, 2, 6, 0, 3, 0, 13, 1, 6, 0,
    4, 0, 13, 0, 7, 0, 3, 0, 13, 1, 7, 0, 2, 0, 13, 2, 7, 0, 1, 0, 14, 1, 7, 0,
    0, 0, 14, 0, 7, 0, 1, 0, 14, 1, 7, 0, 2, 0, 14, 2, 7, 0, 3, 0, 15, 1, 7, 0,
    4, 0, 15, 0, 8, 0, 4, 0, 15, 1, 8, 0, 3, 0, 15, 2, 8, 0, 2, 1, 15, 1, 8, 0,
    1, 1, 15, 0, 8, 0, 0, 0, 16, 0, 8, 0, 1, 0, 16, 1, 8, 0, 2, 2, 15, 1, 8, 0,
    3, 2, 15, 0, 8, 0, 4, 0, 17, 0, 9, 0, 3, 0, 17, 1, 9, 0, 2, 3, 15, 1, 9, 0,
    1, 3, 15, 0, 9, 0, 0, 0, 18, 0, 9, 0, 1, 0, 18, 1, 9, 0, 2, 0, 18, 2, 9, 0,
    3, 0, 19, 1, 9, 0, 4, 0, 19, 0, 10, 0, 3, 0, 19, 1, 10, 0, 2, 0, 19, 2, 10,
    0, 1, 0, 20, 1, 10, 0, 0, 0, 20, 0, 10, 0, 1, 0, 20, 1, 10, 0, 2, 0, 20, 2,
    10, 0, 3, 0, 21, 1, 10, 0, 4, 0, 21, 0, 11, 0, 3, 0, 21, 1, 11, 0, 2, 0, 21,
    2, 11, 0, 1, 0, 22, 1, 11, 0, 0, 0, 22, 0, 11, 0, 1, 0, 22, 1, 11, 0, 2, 0,
    22, 2, 11, 0, 3, 0, 23, 1, 11, 0, 4, 0, 23, 0, 12, 0, 4, 0, 23, 1, 12, 0, 3,
    0, 23, 2, 12, 0, 2, 1, 23, 1, 12, 0, 1, 1, 23, 0, 12, 0, 0, 0, 24, 0, 12, 0,
    1, 0, 24, 1, 12, 0, 2, 2, 23, 1, 12, 0, 3, 2, 23, 0, 12, 0, 4, 0, 25, 0, 13,
    0, 3, 0, 25, 1, 13, 0, 2, 3, 23, 1, 13, 0, 1, 3, 23, 0, 13, 0, 0, 0, 26, 0,
    13, 0, 1, 0, 26, 1, 13, 0, 2, 0, 26, 2, 13, 0, 3, 0, 27, 1, 13, 0, 4, 0, 27,
    0, 14, 0, 3, 0, 27, 1, 14, 0, 2, 0, 27, 2, 14, 0, 1, 0, 28, 1, 14, 0, 0, 0,
    28, 0, 14, 0, 1, 0, 28, 1, 14, 0, 2, 0, 28, 2, 14, 0, 3, 0, 29, 1, 14, 0, 4,
    0, 29, 0, 15, 0, 3, 0, 29, 1, 15, 0, 2, 0, 29, 2, 15, 0, 1, 0, 30, 1, 15, 0,
    0, 0, 30, 0, 15, 0, 1, 0, 30, 1, 15, 0, 2, 0, 30, 2, 15, 0, 3, 0, 31, 1, 15,
    0, 4, 0, 31, 0, 16, 0, 4, 0, 31, 1, 16, 0, 3, 0, 31, 2, 16, 0, 2, 1, 31, 1,
    16, 0, 1, 1, 31, 0, 16, 0, 0, 4, 28, 0, 16, 0, 1, 4, 28, 1, 16, 0, 2, 2, 31,
    1, 16, 0, 3, 2, 31, 0, 16, 0, 4, 4, 29, 0, 17, 0, 3, 4, 29, 1, 17, 0, 2, 3,
    31, 1, 17, 0, 1, 3, 31, 0, 17, 0, 0, 4, 30, 0, 17, 0, 1, 4, 30, 1, 17, 0, 2,
    4, 30, 2, 17, 0, 3, 4, 31, 1, 17, 0, 4, 4, 31, 0, 18, 0, 3, 4, 31, 1, 18, 0,
    2, 4, 31, 2, 18, 0, 1, 5, 31, 1, 18, 0, 0, 5, 31, 0, 18, 0, 1, 5, 31, 1, 18,
    0, 2, 5, 31, 2, 18, 0, 3, 6, 31, 1, 18, 0, 4, 6, 31, 0, 19, 0, 3, 6, 31, 1,
    19, 0, 2, 6, 31, 2, 19, 0, 1, 7, 31, 1, 19, 0, 0, 7, 31, 0, 19, 0, 1, 7, 31,
    1, 19, 0, 2, 7, 31, 2, 19, 0, 3, 8, 31, 1, 19, 0, 4, 8, 31, 0, 20, 0, 4, 8,
    31, 1, 20, 0, 3, 8, 31, 2, 20, 0, 2, 9, 31, 1, 20, 0, 1, 9, 31, 0, 20, 0, 0,
    12, 28, 0, 20, 0, 1, 12, 28, 1, 20, 0, 2, 10, 31, 1, 20, 0, 3, 10, 31, 0,
    20, 0, 4, 12, 29, 0, 21, 0, 3, 12, 29, 1, 21, 0, 2, 11, 31, 1, 21, 0, 1, 11,
    31, 0, 21, 0, 0, 12, 30, 0, 21, 0, 1, 12, 30, 1, 21, 0, 2, 12, 30, 2, 21, 0,
    3, 12, 31, 1, 21, 0, 4, 12, 31, 0, 22, 0, 3, 12, 31, 1, 22, 0, 2, 12, 31, 2,
    22, 0, 1, 13, 31, 1, 22, 0, 0, 13, 31, 0, 22, 0, 1, 13, 31, 1, 22, 0, 2, 13,
    31, 2, 22, 0, 3, 14, 31, 1, 22, 0, 4, 14, 31, 0, 23, 0, 3, 14, 31, 1, 23, 0,
    2, 14, 31, 2, 23, 0, 1, 15, 31, 1, 23, 0, 0, 15, 31, 0, 23, 0, 1, 15, 31, 1,
    23, 0, 2, 15, 31, 2, 23, 0, 3, 16, 31, 1, 23, 0, 4, 16, 31, 0, 24, 0, 4, 16,
    31, 1, 24, 0, 3, 16, 31, 2, 24, 0, 2, 17, 31, 1, 24, 0, 1, 17, 31, 0, 24, 0,
    0, 20, 28, 0, 24, 0, 1, 20, 28, 1, 24, 0, 2, 18, 31, 1, 24, 0, 3, 18, 31, 0,
    24, 0, 4, 20, 29, 0, 25, 0, 3, 20, 29, 1, 25, 0, 2, 19, 31, 1, 25, 0, 1, 19,
    31, 0, 25, 0, 0, 20, 30, 0, 25, 0, 1, 20, 30, 1, 25, 0, 2, 20, 30, 2, 25, 0,
    3, 20, 31, 1, 25, 0, 4, 20, 31, 0, 26, 0, 3, 20, 31, 1, 26, 0, 2, 20, 31, 2,
    26, 0, 1, 21, 31, 1, 26, 0, 0, 21, 31, 0, 26, 0, 1, 21, 31, 1, 26, 0, 2, 21,
    31, 2, 26, 0, 3, 22, 31, 1, 26, 0, 4, 22, 31, 0, 27, 0, 3, 22, 31, 1, 27, 0,
    2, 22, 31, 2, 27, 0, 1, 23, 31, 1, 27, 0, 0, 23, 31, 0, 27, 0, 1, 23, 31, 1,
    27, 0, 2, 23, 31, 2, 27, 0, 3, 24, 31, 1, 27, 0, 4, 24, 31, 0, 28, 0, 4, 24,
    31, 1, 28, 0, 3, 24, 31, 2, 28, 0, 2, 25, 31, 1, 28, 0, 1, 25, 31, 0, 28, 0,
    0, 28, 28, 0, 28, 0, 1, 28, 28, 1, 28, 0, 2, 26, 31, 1, 28, 0, 3, 26, 31, 0,
    28, 0, 4, 28, 29, 0, 29, 0, 3, 28, 29, 1, 29, 0, 2, 27, 31, 1, 29, 0, 1, 27,
    31, 0, 29, 0, 0, 28, 30, 0, 29, 0, 1, 28, 30, 1, 29, 0, 2, 28, 30, 2, 29, 0,
    3, 28, 31, 1, 29, 0, 4, 28, 31, 0, 30, 0, 3, 28, 31, 1, 30, 0, 2, 28, 31, 2,
    30, 0, 1, 29, 31, 1, 30, 0, 0, 29, 31, 0, 30, 0, 1, 29, 31, 1, 30, 0, 2, 29,
    31, 2, 30, 0, 3, 30, 31, 1, 30, 0, 4, 30, 31, 0, 31, 0, 3, 30, 31, 1, 31, 0,
    2, 30, 31, 2, 31, 0, 1, 31, 31, 1, 31, 0, 0, 31, 31, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 1, 0, 1, 1, 0, 0, 2, 0, 1, 0, 1, 0, 1, 0, 2, 1, 1, 0, 0, 0, 2, 0, 1, 0,
    1, 0, 3, 1, 1, 0, 2, 0, 3, 0, 2, 0, 1, 0, 4, 1, 2, 0, 0, 0, 4, 0, 2, 0, 1,
    0, 5, 1, 2, 0, 2, 0, 5, 0, 3, 0, 1, 0, 6, 1, 3, 0, 0, 0, 6, 0, 3, 0, 1, 0,
    7, 1, 3, 0, 2, 0, 7, 0, 4, 0, 1, 0, 8, 1, 4, 0, 0, 0, 8, 0, 4, 0, 1, 0, 9,
    1, 4, 0, 2, 0, 9, 0, 5, 0, 1, 0, 10, 1, 5, 0, 0, 0, 10, 0, 5, 0, 1, 0, 11,
    1, 5, 0, 2, 0, 11, 0, 6, 0, 1, 0, 12, 1, 6, 0, 0, 0, 12, 0, 6, 0, 1, 0, 13,
    1, 6, 0, 2, 0, 13, 0, 7, 0, 1, 0, 14, 1, 7, 0, 0, 0, 14, 0, 7, 0, 1, 0, 15,
    1, 7, 0, 2, 0, 15, 0, 8, 0, 1, 0, 16, 1, 8, 0, 0, 0, 16, 0, 8, 0, 1, 0, 17,
    1, 8, 0, 2, 0, 17, 0, 9, 0, 1, 0, 18, 1, 9, 0, 0, 0, 18, 0, 9, 0, 1, 0, 19,
    1, 9, 0, 2, 0, 19, 0, 10, 0, 1, 0, 20, 1, 10, 0, 0, 0, 20, 0, 10, 0, 1, 0,
    21, 1, 10, 0, 2, 0, 21, 0, 11, 0, 1, 0, 22, 1, 11, 0, 0, 0, 22, 0, 11, 0, 1,
    0, 23, 1, 11, 0, 2, 0, 23, 0, 12, 0, 1, 0, 24, 1, 12, 0, 0, 0, 24, 0, 12, 0,
    1, 0, 25, 1, 12, 0, 2, 0, 25, 0, 13, 0, 1, 0, 26, 1, 13, 0, 0, 0, 26, 0, 13,
    0, 1, 0, 27, 1, 13, 0, 2, 0, 27, 0, 14, 0, 1, 0, 28, 1, 14, 0, 0, 0, 28, 0,
    14, 0, 1, 0, 29, 1, 14, 0, 2, 0, 29, 0, 15, 0, 1, 0, 30, 1, 15, 0, 0, 0, 30,
    0, 15, 0, 1, 0, 31, 1, 15, 0, 2, 0, 31, 0, 16, 0, 2, 1, 31, 1, 16, 0, 1, 1,
    31, 0, 16, 0, 0, 0, 32, 0, 16, 0, 1, 2, 31, 0, 16, 0, 2, 0, 33, 0, 17, 0, 1,
    3, 31, 0, 17, 0, 0, 0, 34, 0, 17, 0, 1, 4, 31, 0, 17, 0, 2, 0, 35, 0, 18, 0,
    1, 5, 31, 0, 18, 0, 0, 0, 36, 0, 18, 0, 1, 6, 31, 0, 18, 0, 2, 0, 37, 0, 19,
    0, 1, 7, 31, 0, 19, 0, 0, 0, 38, 0, 19, 0, 1, 8, 31, 0, 19, 0, 2, 0, 39, 0,
    20, 0, 1, 9, 31, 0, 20, 0, 0, 0, 40, 0, 20, 0, 1, 10, 31, 0, 20, 0, 2, 0,
    41, 0, 21, 0, 1, 11, 31, 0, 21, 0, 0, 0, 42, 0, 21, 0, 1, 12, 31, 0, 21, 0,
    2, 0, 43, 0, 22, 0, 1, 13, 31, 0, 22, 0, 0, 0, 44, 0, 22, 0, 1, 14, 31, 0,
    22, 0, 2, 0, 45, 0, 23, 0, 1, 15, 31, 0, 23, 0, 0, 0, 46, 0, 23, 0, 1, 0,
    47, 1, 23, 0, 2, 0, 47, 0, 24, 0, 1, 0, 48, 1, 24, 0, 0, 0, 48, 0, 24, 0, 1,
    0, 49, 1, 24, 0, 2, 0, 49, 0, 25, 0, 1, 0, 50, 1, 25, 0, 0, 0, 50, 0, 25, 0,
    1, 0, 51, 1, 25, 0, 2, 0, 51, 0, 26, 0, 1, 0, 52, 1, 26, 0, 0, 0, 52, 0, 26,
    0, 1, 0, 53, 1, 26, 0, 2, 0, 53, 0, 27, 0, 1, 0, 54, 1, 27, 0, 0, 0, 54, 0,
    27, 0, 1, 0, 55, 1, 27, 0, 2, 0, 55, 0, 28, 0, 1, 0, 56, 1, 28, 0, 0, 0, 56,
    0, 28, 0, 1, 0, 57, 1, 28, 0, 2, 0, 57, 0, 29, 0, 1, 0, 58, 1, 29, 0, 0, 0,
    58, 0, 29, 0, 1, 0, 59, 1, 29, 0, 2, 0, 59, 0, 30, 0, 1, 0, 60, 1, 30, 0, 0,
    0, 60, 0, 30, 0, 1, 0, 61, 1, 30, 0, 2, 0, 61, 0, 31, 0, 1, 0, 62, 1, 31, 0,
    0, 0, 62, 0, 31, 0, 1, 0, 63, 1, 31, 0, 2, 0, 63, 0, 32, 0, 2, 1, 63, 1, 32,
    0, 1, 1, 63, 0, 32, 0, 0, 16, 48, 0, 32, 0, 1, 2, 63, 0, 32, 0, 2, 16, 49,
    0, 33, 0, 1, 3, 63, 0, 33, 0, 0, 16, 50, 0, 33, 0, 1, 4, 63, 0, 33, 0, 2,
    16, 51, 0, 34, 0, 1, 5, 63, 0, 34, 0, 0, 16, 52, 0, 34, 0, 1, 6, 63, 0, 34,
    0, 2, 16, 53, 0, 35, 0, 1, 7, 63, 0, 35, 0, 0, 16, 54, 0, 35, 0, 1, 8, 63,
    0, 35, 0, 2, 16, 55, 0, 36, 0, 1, 9, 63, 0, 36, 0, 0, 16, 56, 0, 36, 0, 1,
    10, 63, 0, 36, 0, 2, 16, 57, 0, 37, 0, 1, 11, 63, 0, 37, 0, 0, 16, 58, 0,
    37, 0, 1, 12, 63, 0, 37, 0, 2, 16, 59, 0, 38, 0, 1, 13, 63, 0, 38, 0, 0, 16,
    60, 0, 38, 0, 1, 14, 63, 0, 38, 0, 2, 16, 61, 0, 39, 0, 1, 15, 63, 0, 39, 0,
    0, 16, 62, 0, 39, 0, 1, 16, 63, 1, 39, 0, 2, 16, 63, 0, 40, 0, 1, 17, 63, 1,
    40, 0, 0, 17, 63, 0, 40, 0, 1, 18, 63, 1, 40, 0, 2, 18, 63, 0, 41, 0, 1, 19,
    63, 1, 41, 0, 0, 19, 63, 0, 41, 0, 1, 20, 63, 1, 41, 0, 2, 20, 63, 0, 42, 0,
    1, 21, 63, 1, 42, 0, 0, 21, 63, 0, 42, 0, 1, 22, 63, 1, 42, 0, 2, 22, 63, 0,
    43, 0, 1, 23, 63, 1, 43, 0, 0, 23, 63, 0, 43, 0, 1, 24, 63, 1, 43, 0, 2, 24,
    63, 0, 44, 0, 1, 25, 63, 1, 44, 0, 0, 25, 63, 0, 44, 0, 1, 26, 63, 1, 44, 0,
    2, 26, 63, 0, 45, 0, 1, 27, 63, 1, 45, 0, 0, 27, 63, 0, 45, 0, 1, 28, 63, 1,
    45, 0, 2, 28, 63, 0, 46, 0, 1, 29, 63, 1, 46, 0, 0, 29, 63, 0, 46, 0, 1, 30,
    63, 1, 46, 0, 2, 30, 63, 0, 47, 0, 1, 31, 63, 1, 47, 0, 0, 31, 63, 0, 47, 0,
    1, 32, 63, 1, 47, 0, 2, 32, 63, 0, 48, 0, 2, 33, 63, 1, 48, 0, 1, 33, 63, 0,
    48, 0, 0, 48, 48, 0, 48, 0, 1, 34, 63, 0, 48, 0, 2, 48, 49, 0, 49, 0, 1, 35,
    63, 0, 49, 0, 0, 48, 50, 0, 49, 0, 1, 36, 63, 0, 49, 0, 2, 48, 51, 0, 50, 0,
    1, 37, 63, 0, 50, 0, 0, 48, 52, 0, 50, 0, 1, 38, 63, 0, 50, 0, 2, 48, 53, 0,
    51, 0, 1, 39, 63, 0, 51, 0, 0, 48, 54, 0, 51, 0, 1, 40, 63, 0, 51, 0, 2, 48,
    55, 0, 52, 0, 1, 41, 63, 0, 52, 0, 0, 48, 56, 0, 52, 0, 1, 42, 63, 0, 52, 0,
    2, 48, 57, 0, 53, 0, 1, 43, 63, 0, 53, 0, 0, 48, 58, 0, 53, 0, 1, 44, 63, 0,
    53, 0, 2, 48, 59, 0, 54, 0, 1, 45, 63, 0, 54, 0, 0, 48, 60, 0, 54, 0, 1, 46,
    63, 0, 54, 0, 2, 48, 61, 0, 55, 0, 1, 47, 63, 0, 55, 0, 0, 48, 62, 0, 55, 0,
    1, 48, 63, 1, 55, 0, 2, 48, 63, 0, 56, 0, 1, 49, 63, 1, 56, 0, 0, 49, 63, 0,
    56, 0, 1, 50, 63, 1, 56, 0, 2, 50, 63, 0, 57, 0, 1, 51, 63, 1, 57, 0, 0, 51,
    63, 0, 57, 0, 1, 52, 63, 1, 57, 0, 2, 52, 63, 0, 58, 0, 1, 53, 63, 1, 58, 0,
    0, 53, 63, 0, 58, 0, 1, 54, 63, 1, 58, 0, 2, 54, 63, 0, 59, 0, 1, 55, 63, 1,
    59, 0, 0, 55, 63, 0, 59, 0, 1, 56, 63, 1, 59, 0, 2, 56, 63, 0, 60, 0, 1, 57,
    63, 1, 60, 0, 0, 57, 63, 0, 60, 0, 1, 58, 63, 1, 60, 0, 2, 58, 63, 0, 61, 0,
    1, 59, 63, 1, 61, 0, 0, 59, 63, 0, 61, 0, 1, 60, 63, 1, 61, 0, 2, 60, 63, 0,
    62, 0, 1, 61, 63, 1, 62, 0, 0, 61, 63, 0, 62, 0, 1, 62, 63, 1, 62, 0, 2, 62,
    63, 0, 63, 0, 1, 63, 63, 1, 63, 0, 0, 63, 63, 0, 78, 54, 115, 113, 117, 105,
    115, 104, 49, 53, 83, 105, 110, 103, 108, 101, 67, 111, 108, 111, 117, 114,
    70, 105, 116, 69, 0, 78, 49, 48, 95, 95, 99, 120, 120, 97, 98, 105, 118, 49,
    49, 54, 95, 95, 115, 104, 105, 109, 95, 116, 121, 112, 101, 95, 105, 110,
    102, 111, 69, 0, 83, 116, 57, 116, 121, 112, 101, 95, 105, 110, 102, 111, 0,
    78, 49, 48, 95, 95, 99, 120, 120, 97, 98, 105, 118, 49, 50, 48, 95, 95, 115,
    105, 95, 99, 108, 97, 115, 115, 95, 116, 121, 112, 101, 95, 105, 110, 102,
    111, 69, 0, 78, 49, 48, 95, 95, 99, 120, 120, 97, 98, 105, 118, 49, 49, 55,
    95, 95, 99, 108, 97, 115, 115, 95, 116, 121, 112, 101, 95, 105, 110, 102,
    111, 69, 0,
  ],
  "i8",
  ALLOC_NONE,
  Runtime.GLOBAL_BASE
);
var tempDoublePtr = STATICTOP;
STATICTOP += 16;
function ___cxa_pure_virtual() {
  ABORT = true;
  throw "Pure virtual function called!";
}
function ___setErrNo(value) {
  if (Module["___errno_location"])
    HEAP32[Module["___errno_location"]() >> 2] = value;
  return value;
}
function __ZSt18uncaught_exceptionv() {
  return !!__ZSt18uncaught_exceptionv.uncaught_exception;
}
var EXCEPTIONS = {
  last: 0,
  caught: [],
  infos: {},
  deAdjust: function (adjusted) {
    if (!adjusted || EXCEPTIONS.infos[adjusted]) return adjusted;
    for (var ptr in EXCEPTIONS.infos) {
      var info = EXCEPTIONS.infos[ptr];
      if (info.adjusted === adjusted) {
        return ptr;
      }
    }
    return adjusted;
  },
  addRef: function (ptr) {
    if (!ptr) return;
    var info = EXCEPTIONS.infos[ptr];
    info.refcount++;
  },
  decRef: function (ptr) {
    if (!ptr) return;
    var info = EXCEPTIONS.infos[ptr];
    assert(info.refcount > 0);
    info.refcount--;
    if (info.refcount === 0 && !info.rethrown) {
      if (info.destructor) {
        Module["dynCall_vi"](info.destructor, ptr);
      }
      delete EXCEPTIONS.infos[ptr];
      ___cxa_free_exception(ptr);
    }
  },
  clearRef: function (ptr) {
    if (!ptr) return;
    var info = EXCEPTIONS.infos[ptr];
    info.refcount = 0;
  },
};
function ___resumeException(ptr) {
  if (!EXCEPTIONS.last) {
    EXCEPTIONS.last = ptr;
  }
  throw (
    ptr +
    " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch."
  );
}
function ___cxa_find_matching_catch() {
  var thrown = EXCEPTIONS.last;
  if (!thrown) {
    return (Runtime.setTempRet0(0), 0) | 0;
  }
  var info = EXCEPTIONS.infos[thrown];
  var throwntype = info.type;
  if (!throwntype) {
    return (Runtime.setTempRet0(0), thrown) | 0;
  }
  var typeArray = Array.prototype.slice.call(arguments);
  var pointer = Module["___cxa_is_pointer_type"](throwntype);
  if (!___cxa_find_matching_catch.buffer)
    ___cxa_find_matching_catch.buffer = _malloc(4);
  HEAP32[___cxa_find_matching_catch.buffer >> 2] = thrown;
  thrown = ___cxa_find_matching_catch.buffer;
  for (var i = 0; i < typeArray.length; i++) {
    if (
      typeArray[i] &&
      Module["___cxa_can_catch"](typeArray[i], throwntype, thrown)
    ) {
      thrown = HEAP32[thrown >> 2];
      info.adjusted = thrown;
      return (Runtime.setTempRet0(typeArray[i]), thrown) | 0;
    }
  }
  thrown = HEAP32[thrown >> 2];
  return (Runtime.setTempRet0(throwntype), thrown) | 0;
}
function ___gxx_personality_v0() {}
function ___lock() {}
var _llvm_pow_f32 = Math_pow;
function _emscripten_memcpy_big(dest, src, num) {
  HEAPU8.set(HEAPU8.subarray(src, src + num), dest);
  return dest;
}
var SYSCALLS = {
  varargs: 0,
  get: function (varargs) {
    SYSCALLS.varargs += 4;
    var ret = HEAP32[(SYSCALLS.varargs - 4) >> 2];
    return ret;
  },
  getStr: function () {
    var ret = Pointer_stringify(SYSCALLS.get());
    return ret;
  },
  get64: function () {
    var low = SYSCALLS.get(),
      high = SYSCALLS.get();
    if (low >= 0) assert(high === 0);
    else assert(high === -1);
    return low;
  },
  getZero: function () {
    assert(SYSCALLS.get() === 0);
  },
};
function ___syscall140(which, varargs) {
  SYSCALLS.varargs = varargs;
  try {
    var stream = SYSCALLS.getStreamFromFD(),
      offset_high = SYSCALLS.get(),
      offset_low = SYSCALLS.get(),
      result = SYSCALLS.get(),
      whence = SYSCALLS.get();
    var offset = offset_low;
    FS.llseek(stream, offset, whence);
    HEAP32[result >> 2] = stream.position;
    if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null;
    return 0;
  } catch (e) {
    if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
}
function ___syscall146(which, varargs) {
  SYSCALLS.varargs = varargs;
  try {
    var stream = SYSCALLS.get(),
      iov = SYSCALLS.get(),
      iovcnt = SYSCALLS.get();
    var ret = 0;
    if (!___syscall146.buffer) {
      ___syscall146.buffers = [null, [], []];
      ___syscall146.printChar = function (stream, curr) {
        var buffer = ___syscall146.buffers[stream];
        assert(buffer);
        if (curr === 0 || curr === 10) {
          (stream === 1 ? Module["print"] : Module["printErr"])(
            UTF8ArrayToString(buffer, 0)
          );
          buffer.length = 0;
        } else {
          buffer.push(curr);
        }
      };
    }
    for (var i = 0; i < iovcnt; i++) {
      var ptr = HEAP32[(iov + i * 8) >> 2];
      var len = HEAP32[(iov + (i * 8 + 4)) >> 2];
      for (var j = 0; j < len; j++) {
        ___syscall146.printChar(stream, HEAPU8[ptr + j]);
      }
      ret += len;
    }
    return ret;
  } catch (e) {
    if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
}
function ___syscall54(which, varargs) {
  SYSCALLS.varargs = varargs;
  try {
    return 0;
  } catch (e) {
    if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
}
function ___unlock() {}
function ___syscall6(which, varargs) {
  SYSCALLS.varargs = varargs;
  try {
    var stream = SYSCALLS.getStreamFromFD();
    FS.close(stream);
    return 0;
  } catch (e) {
    if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
}
__ATEXIT__.push(function () {
  var fflush = Module["_fflush"];
  if (fflush) fflush(0);
  var printChar = ___syscall146.printChar;
  if (!printChar) return;
  var buffers = ___syscall146.buffers;
  if (buffers[1].length) printChar(1, 10);
  if (buffers[2].length) printChar(2, 10);
});
DYNAMICTOP_PTR = allocate(1, "i32", ALLOC_STATIC);
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);
STACK_MAX = STACK_BASE + TOTAL_STACK;
DYNAMIC_BASE = Runtime.alignMemory(STACK_MAX);
HEAP32[DYNAMICTOP_PTR >> 2] = DYNAMIC_BASE;
staticSealed = true;
function invoke_iiii(index, a1, a2, a3) {
  try {
    return Module["dynCall_iiii"](index, a1, a2, a3);
  } catch (e) {
    if (typeof e !== "number" && e !== "longjmp") throw e;
    Module["setThrew"](1, 0);
  }
}
function invoke_viiiii(index, a1, a2, a3, a4, a5) {
  try {
    Module["dynCall_viiiii"](index, a1, a2, a3, a4, a5);
  } catch (e) {
    if (typeof e !== "number" && e !== "longjmp") throw e;
    Module["setThrew"](1, 0);
  }
}
function invoke_vi(index, a1) {
  try {
    Module["dynCall_vi"](index, a1);
  } catch (e) {
    if (typeof e !== "number" && e !== "longjmp") throw e;
    Module["setThrew"](1, 0);
  }
}
function invoke_vii(index, a1, a2) {
  try {
    Module["dynCall_vii"](index, a1, a2);
  } catch (e) {
    if (typeof e !== "number" && e !== "longjmp") throw e;
    Module["setThrew"](1, 0);
  }
}
function invoke_ii(index, a1) {
  try {
    return Module["dynCall_ii"](index, a1);
  } catch (e) {
    if (typeof e !== "number" && e !== "longjmp") throw e;
    Module["setThrew"](1, 0);
  }
}
function invoke_v(index) {
  try {
    Module["dynCall_v"](index);
  } catch (e) {
    if (typeof e !== "number" && e !== "longjmp") throw e;
    Module["setThrew"](1, 0);
  }
}
function invoke_viiiiii(index, a1, a2, a3, a4, a5, a6) {
  try {
    Module["dynCall_viiiiii"](index, a1, a2, a3, a4, a5, a6);
  } catch (e) {
    if (typeof e !== "number" && e !== "longjmp") throw e;
    Module["setThrew"](1, 0);
  }
}
function invoke_viiii(index, a1, a2, a3, a4) {
  try {
    Module["dynCall_viiii"](index, a1, a2, a3, a4);
  } catch (e) {
    if (typeof e !== "number" && e !== "longjmp") throw e;
    Module["setThrew"](1, 0);
  }
}
Module.asmGlobalArg = {
  Math: Math,
  Int8Array: Int8Array,
  Int16Array: Int16Array,
  Int32Array: Int32Array,
  Uint8Array: Uint8Array,
  Uint16Array: Uint16Array,
  Uint32Array: Uint32Array,
  Float32Array: Float32Array,
  Float64Array: Float64Array,
  NaN: NaN,
  Infinity: Infinity,
  byteLength: byteLength,
};
Module.asmLibraryArg = {
  abort: abort,
  assert: assert,
  enlargeMemory: enlargeMemory,
  getTotalMemory: getTotalMemory,
  abortOnCannotGrowMemory: abortOnCannotGrowMemory,
  invoke_iiii: invoke_iiii,
  invoke_viiiii: invoke_viiiii,
  invoke_vi: invoke_vi,
  invoke_vii: invoke_vii,
  invoke_ii: invoke_ii,
  invoke_v: invoke_v,
  invoke_viiiiii: invoke_viiiiii,
  invoke_viiii: invoke_viiii,
  ___lock: ___lock,
  ___syscall6: ___syscall6,
  ___setErrNo: ___setErrNo,
  ___syscall140: ___syscall140,
  _llvm_pow_f32: _llvm_pow_f32,
  ___gxx_personality_v0: ___gxx_personality_v0,
  _emscripten_memcpy_big: _emscripten_memcpy_big,
  ___syscall54: ___syscall54,
  ___unlock: ___unlock,
  ___resumeException: ___resumeException,
  __ZSt18uncaught_exceptionv: __ZSt18uncaught_exceptionv,
  ___cxa_pure_virtual: ___cxa_pure_virtual,
  ___syscall146: ___syscall146,
  ___cxa_find_matching_catch: ___cxa_find_matching_catch,
  DYNAMICTOP_PTR: DYNAMICTOP_PTR,
  tempDoublePtr: tempDoublePtr,
  ABORT: ABORT,
  STACKTOP: STACKTOP,
  STACK_MAX: STACK_MAX,
}; // EMSCRIPTEN_START_ASM
var asm = (function (global, env, buffer) {
  "almost asm";
  var a = global.Int8Array;
  var b = new a(buffer);
  var c = global.Int16Array;
  var d = new c(buffer);
  var e = global.Int32Array;
  var f = new e(buffer);
  var g = global.Uint8Array;
  var h = new g(buffer);
  var i = global.Uint16Array;
  var j = new i(buffer);
  var k = global.Uint32Array;
  var l = new k(buffer);
  var m = global.Float32Array;
  var n = new m(buffer);
  var o = global.Float64Array;
  var p = new o(buffer);
  var q = global.byteLength;
  var r = env.DYNAMICTOP_PTR | 0;
  var s = env.tempDoublePtr | 0;
  var t = env.ABORT | 0;
  var u = env.STACKTOP | 0;
  var v = env.STACK_MAX | 0;
  var w = 0;
  var x = 0;
  var y = 0;
  var z = 0;
  var A = global.NaN,
    B = global.Infinity;
  var C = 0,
    D = 0,
    E = 0,
    F = 0,
    G = 0.0;
  var H = 0;
  var I = global.Math.floor;
  var J = global.Math.abs;
  var K = global.Math.sqrt;
  var L = global.Math.pow;
  var M = global.Math.cos;
  var N = global.Math.sin;
  var O = global.Math.tan;
  var P = global.Math.acos;
  var Q = global.Math.asin;
  var R = global.Math.atan;
  var S = global.Math.atan2;
  var T = global.Math.exp;
  var U = global.Math.log;
  var V = global.Math.ceil;
  var W = global.Math.imul;
  var X = global.Math.min;
  var Y = global.Math.max;
  var Z = global.Math.clz32;
  var _ = env.abort;
  var $ = env.assert;
  var aa = env.enlargeMemory;
  var ba = env.getTotalMemory;
  var ca = env.abortOnCannotGrowMemory;
  var da = env.invoke_iiii;
  var ea = env.invoke_viiiii;
  var fa = env.invoke_vi;
  var ga = env.invoke_vii;
  var ha = env.invoke_ii;
  var ia = env.invoke_v;
  var ja = env.invoke_viiiiii;
  var ka = env.invoke_viiii;
  var la = env.___lock;
  var ma = env.___syscall6;
  var na = env.___setErrNo;
  var oa = env.___syscall140;
  var pa = env._llvm_pow_f32;
  var qa = env.___gxx_personality_v0;
  var ra = env._emscripten_memcpy_big;
  var sa = env.___syscall54;
  var ta = env.___unlock;
  var ua = env.___resumeException;
  var va = env.__ZSt18uncaught_exceptionv;
  var wa = env.___cxa_pure_virtual;
  var xa = env.___syscall146;
  var ya = env.___cxa_find_matching_catch;
  var za = 0.0;
  function Aa(newBuffer) {
    if (
      q(newBuffer) & 16777215 ||
      q(newBuffer) <= 16777215 ||
      q(newBuffer) > 2147483648
    )
      return false;
    b = new a(newBuffer);
    d = new c(newBuffer);
    f = new e(newBuffer);
    h = new g(newBuffer);
    j = new i(newBuffer);
    l = new k(newBuffer);
    n = new m(newBuffer);
    p = new o(newBuffer);
    buffer = newBuffer;
    return true;
  }
  // EMSCRIPTEN_START_FUNCS
  function Ja(a) {
    a = a | 0;
    var b = 0;
    b = u;
    u = (u + a) | 0;
    u = (u + 15) & -16;
    return b | 0;
  }
  function Ka() {
    return u | 0;
  }
  function La(a) {
    a = a | 0;
    u = a;
  }
  function Ma(a, b) {
    a = a | 0;
    b = b | 0;
    u = a;
    v = b;
  }
  function Na(a, b) {
    a = a | 0;
    b = b | 0;
    if (!w) {
      w = a;
      x = b;
    }
  }
  function Oa(a) {
    a = a | 0;
    H = a;
  }
  function Pa() {
    return H | 0;
  }
  function Qa(a, c, d) {
    a = a | 0;
    c = c | 0;
    d = d | 0;
    var e = 0,
      f = 0,
      g = 0,
      i = 0;
    e = 0;
    do {
      f = e << 3;
      g = ~~(+(h[(a + (f | 3)) >> 0] | 0) * 0.05882352963089943 + 0.5);
      i = ~~(+(h[(a + (f | 7)) >> 0] | 0) * 0.05882352963089943 + 0.5);
      f = e << 1;
      b[(d + e) >> 0] =
        (((((1 << (f | 1)) & c) | 0) == 0) | ((i | 0) < 0)
          ? 0
          : ((i | 0) < 15 ? i : 15) << 4) |
        (((((1 << f) & c) | 0) == 0) | ((g | 0) < 0)
          ? 0
          : (g | 0) < 15
          ? g
          : 15);
      e = (e + 1) | 0;
    } while ((e | 0) != 8);
    return;
  }
  function Ra(a, c) {
    a = a | 0;
    c = c | 0;
    var d = 0;
    d = h[c >> 0] | 0;
    b[(a + 3) >> 0] = (d & 15) | (d << 4);
    b[(a + 7) >> 0] = (d & 240) | (d >>> 4);
    d = h[(c + 1) >> 0] | 0;
    b[(a + 11) >> 0] = (d & 15) | (d << 4);
    b[(a + 15) >> 0] = (d & 240) | (d >>> 4);
    d = h[(c + 2) >> 0] | 0;
    b[(a + 19) >> 0] = (d & 15) | (d << 4);
    b[(a + 23) >> 0] = (d & 240) | (d >>> 4);
    d = h[(c + 3) >> 0] | 0;
    b[(a + 27) >> 0] = (d & 15) | (d << 4);
    b[(a + 31) >> 0] = (d & 240) | (d >>> 4);
    d = h[(c + 4) >> 0] | 0;
    b[(a + 35) >> 0] = (d & 15) | (d << 4);
    b[(a + 39) >> 0] = (d & 240) | (d >>> 4);
    d = h[(c + 5) >> 0] | 0;
    b[(a + 43) >> 0] = (d & 15) | (d << 4);
    b[(a + 47) >> 0] = (d & 240) | (d >>> 4);
    d = h[(c + 6) >> 0] | 0;
    b[(a + 51) >> 0] = (d & 15) | (d << 4);
    b[(a + 55) >> 0] = (d & 240) | (d >>> 4);
    d = h[(c + 7) >> 0] | 0;
    b[(a + 59) >> 0] = (d & 15) | (d << 4);
    b[(a + 63) >> 0] = (d & 240) | (d >>> 4);
    return;
  }
  function Sa(a, c, d) {
    a = a | 0;
    c = c | 0;
    d = d | 0;
    var e = 0,
      f = 0,
      g = 0,
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
      J = 0,
      K = 0,
      L = 0,
      M = 0,
      N = 0,
      O = 0,
      P = 0,
      Q = 0;
    e = u;
    u = (u + 64) | 0;
    f = (e + 48) | 0;
    g = (e + 40) | 0;
    i = (e + 32) | 0;
    j = (e + 16) | 0;
    k = e;
    l = 0;
    m = 255;
    n = 0;
    o = 0;
    p = 255;
    while (1) {
      if (!((1 << n) & c)) {
        q = l;
        r = o;
        s = m;
        t = p;
      } else {
        v = b[(a + ((n << 2) | 3)) >> 0] | 0;
        w = v & 255;
        q = ((v << 24) >> 24 != -1) & ((w | 0) > (l | 0)) ? w : l;
        r = (w | 0) > (o | 0) ? w : o;
        s = ((v << 24) >> 24 != 0) & ((w | 0) < (m | 0)) ? w : m;
        t = (w | 0) < (p | 0) ? w : p;
      }
      n = (n + 1) | 0;
      if ((n | 0) == 16) break;
      else {
        l = q;
        m = s;
        o = r;
        p = t;
      }
    }
    p = (s | 0) > (q | 0) ? q : s;
    s = (t | 0) > (r | 0) ? r : t;
    t = (p + 5) | 0;
    o = ((q - p) | 0) < 5 ? ((t | 0) < 255 ? t : 255) : q;
    q = (o + -5) | 0;
    t = ((o - p) | 0) < 5 ? ((q | 0) > 0 ? q : 0) : p;
    p = (s + 7) | 0;
    q = ((r - s) | 0) < 7 ? ((p | 0) < 255 ? p : 255) : r;
    r = (q + -7) | 0;
    p = t & 255;
    b[g >> 0] = p;
    m = o & 255;
    b[(g + 1) >> 0] = m;
    b[(g + 2) >> 0] = ((((t << 2) + o) | 0) / 5) | 0;
    b[(g + 3) >> 0] = (((((t * 3) | 0) + (o << 1)) | 0) / 5) | 0;
    b[(g + 4) >> 0] = ((((t << 1) + ((o * 3) | 0)) | 0) / 5) | 0;
    b[(g + 5) >> 0] = (((t + (o << 2)) | 0) / 5) | 0;
    l = ((q - s) | 0) < 7 ? ((r | 0) > 0 ? r : 0) : s;
    b[(g + 6) >> 0] = 0;
    b[(g + 7) >> 0] = -1;
    s = l & 255;
    b[i >> 0] = s;
    r = q & 255;
    b[(i + 1) >> 0] = r;
    b[(i + 2) >> 0] = (((((l * 6) | 0) + q) | 0) / 7) | 0;
    b[(i + 3) >> 0] = (((((l * 5) | 0) + (q << 1)) | 0) / 7) | 0;
    b[(i + 4) >> 0] = ((((l << 2) + ((q * 3) | 0)) | 0) / 7) | 0;
    b[(i + 5) >> 0] = (((((l * 3) | 0) + (q << 2)) | 0) / 7) | 0;
    b[(i + 6) >> 0] = ((((l << 1) + ((q * 5) | 0)) | 0) / 7) | 0;
    b[(i + 7) >> 0] = (((l + ((q * 6) | 0)) | 0) / 7) | 0;
    n = Ta(a, c, g, j) | 0;
    if ((n | 0) <= (Ta(a, c, i, k) | 0)) {
      if ((t | 0) <= (o | 0)) {
        b[d >> 0] = p;
        b[(d + 1) >> 0] = m;
        o =
          ((h[(j + 1) >> 0] | 0) << 3) |
          (h[j >> 0] | 0) |
          ((h[(j + 2) >> 0] | 0) << 6);
        t =
          ((h[(j + 3) >> 0] | 0) << 9) |
          o |
          ((h[(j + 4) >> 0] | 0) << 12) |
          ((h[(j + 5) >> 0] | 0) << 15);
        i = ((h[(j + 6) >> 0] | 0) << 18) | t | ((h[(j + 7) >> 0] | 0) << 21);
        b[(d + 2) >> 0] = o;
        b[(d + 3) >> 0] = t >>> 8;
        b[(d + 4) >> 0] = i >>> 16;
        i =
          ((h[(j + 9) >> 0] | 0) << 3) |
          (h[(j + 8) >> 0] | 0) |
          ((h[(j + 10) >> 0] | 0) << 6);
        t =
          ((h[(j + 11) >> 0] | 0) << 9) |
          i |
          ((h[(j + 12) >> 0] | 0) << 12) |
          ((h[(j + 13) >> 0] | 0) << 15);
        o = ((h[(j + 14) >> 0] | 0) << 18) | t | ((h[(j + 15) >> 0] | 0) << 21);
        b[(d + 5) >> 0] = i;
        b[(d + 6) >> 0] = t >>> 8;
        b[(d + 7) >> 0] = o >>> 16;
        u = e;
        return;
      }
      o = 0;
      do {
        t = b[(j + o) >> 0] | 0;
        switch ((t << 24) >> 24) {
          case 0: {
            x = 1;
            break;
          }
          case 1: {
            x = 0;
            break;
          }
          default:
            if ((t & 255) < 6) x = (7 - (t & 255)) & 255;
            else x = t;
        }
        b[(f + o) >> 0] = x;
        o = (o + 1) | 0;
      } while ((o | 0) != 16);
      b[d >> 0] = m;
      b[(d + 1) >> 0] = p;
      p =
        ((h[(f + 1) >> 0] | 0) << 3) |
        (h[f >> 0] | 0) |
        ((h[(f + 2) >> 0] | 0) << 6);
      m =
        ((h[(f + 3) >> 0] | 0) << 9) |
        p |
        ((h[(f + 4) >> 0] | 0) << 12) |
        ((h[(f + 5) >> 0] | 0) << 15);
      o = ((h[(f + 6) >> 0] | 0) << 18) | m | ((h[(f + 7) >> 0] | 0) << 21);
      b[(d + 2) >> 0] = p;
      b[(d + 3) >> 0] = m >>> 8;
      b[(d + 4) >> 0] = o >>> 16;
      o =
        ((h[(f + 9) >> 0] | 0) << 3) |
        (h[(f + 8) >> 0] | 0) |
        ((h[(f + 10) >> 0] | 0) << 6);
      m =
        ((h[(f + 11) >> 0] | 0) << 9) |
        o |
        ((h[(f + 12) >> 0] | 0) << 12) |
        ((h[(f + 13) >> 0] | 0) << 15);
      p = ((h[(f + 14) >> 0] | 0) << 18) | m | ((h[(f + 15) >> 0] | 0) << 21);
      b[(d + 5) >> 0] = o;
      b[(d + 6) >> 0] = m >>> 8;
      b[(d + 7) >> 0] = p >>> 16;
      u = e;
      return;
    }
    if ((l | 0) < (q | 0)) {
      q = b[k >> 0] | 0;
      switch ((q << 24) >> 24) {
        case 0: {
          y = 1;
          break;
        }
        case 1: {
          y = 0;
          break;
        }
        default:
          y = (9 - (q & 255)) & 255;
      }
      q = b[(k + 1) >> 0] | 0;
      switch ((q << 24) >> 24) {
        case 0: {
          z = 8;
          break;
        }
        case 1: {
          z = 0;
          break;
        }
        default:
          z = ((9 - (q & 255)) << 3) & 2040;
      }
      q = b[(k + 2) >> 0] | 0;
      switch ((q << 24) >> 24) {
        case 0: {
          A = 64;
          break;
        }
        case 1: {
          A = 0;
          break;
        }
        default:
          A = ((9 - (q & 255)) << 6) & 16320;
      }
      q = b[(k + 3) >> 0] | 0;
      switch ((q << 24) >> 24) {
        case 0: {
          B = 512;
          break;
        }
        case 1: {
          B = 0;
          break;
        }
        default:
          B = ((9 - (q & 255)) << 9) & 130560;
      }
      q = b[(k + 4) >> 0] | 0;
      switch ((q << 24) >> 24) {
        case 0: {
          C = 4096;
          break;
        }
        case 1: {
          C = 0;
          break;
        }
        default:
          C = ((9 - (q & 255)) << 12) & 1044480;
      }
      q = b[(k + 5) >> 0] | 0;
      switch ((q << 24) >> 24) {
        case 0: {
          D = 32768;
          break;
        }
        case 1: {
          D = 0;
          break;
        }
        default:
          D = ((9 - (q & 255)) << 15) & 8355840;
      }
      q = b[(k + 6) >> 0] | 0;
      switch ((q << 24) >> 24) {
        case 0: {
          E = 262144;
          break;
        }
        case 1: {
          E = 0;
          break;
        }
        default:
          E = ((9 - (q & 255)) << 18) & 66846720;
      }
      q = b[(k + 7) >> 0] | 0;
      switch ((q << 24) >> 24) {
        case 0: {
          F = 2097152;
          break;
        }
        case 1: {
          F = 0;
          break;
        }
        default:
          F = ((9 - (q & 255)) << 21) & 534773760;
      }
      q = b[(k + 8) >> 0] | 0;
      switch ((q << 24) >> 24) {
        case 0: {
          G = 1;
          break;
        }
        case 1: {
          G = 0;
          break;
        }
        default:
          G = (9 - (q & 255)) & 255;
      }
      q = b[(k + 9) >> 0] | 0;
      switch ((q << 24) >> 24) {
        case 0: {
          H = 8;
          break;
        }
        case 1: {
          H = 0;
          break;
        }
        default:
          H = ((9 - (q & 255)) << 3) & 2040;
      }
      q = b[(k + 10) >> 0] | 0;
      switch ((q << 24) >> 24) {
        case 0: {
          I = 64;
          break;
        }
        case 1: {
          I = 0;
          break;
        }
        default:
          I = ((9 - (q & 255)) << 6) & 16320;
      }
      q = b[(k + 11) >> 0] | 0;
      switch ((q << 24) >> 24) {
        case 0: {
          J = 512;
          break;
        }
        case 1: {
          J = 0;
          break;
        }
        default:
          J = ((9 - (q & 255)) << 9) & 130560;
      }
      q = b[(k + 12) >> 0] | 0;
      switch ((q << 24) >> 24) {
        case 0: {
          K = 4096;
          break;
        }
        case 1: {
          K = 0;
          break;
        }
        default:
          K = ((9 - (q & 255)) << 12) & 1044480;
      }
      q = b[(k + 13) >> 0] | 0;
      switch ((q << 24) >> 24) {
        case 0: {
          L = 32768;
          break;
        }
        case 1: {
          L = 0;
          break;
        }
        default:
          L = ((9 - (q & 255)) << 15) & 8355840;
      }
      q = b[(k + 14) >> 0] | 0;
      switch ((q << 24) >> 24) {
        case 0: {
          M = 262144;
          break;
        }
        case 1: {
          M = 0;
          break;
        }
        default:
          M = ((9 - (q & 255)) << 18) & 66846720;
      }
      q = b[(k + 15) >> 0] | 0;
      switch ((q << 24) >> 24) {
        case 0: {
          N = 2097152;
          break;
        }
        case 1: {
          N = 0;
          break;
        }
        default:
          N = ((9 - (q & 255)) << 21) & 534773760;
      }
      b[d >> 0] = r;
      b[(d + 1) >> 0] = s;
      q = z | y | A;
      A = B | q | C | D;
      b[(d + 2) >> 0] = q;
      b[(d + 3) >> 0] = A >>> 8;
      b[(d + 4) >> 0] = (E | A | F) >>> 16;
      F = H | G | I;
      I = J | F | K | L;
      O = M | I | N;
      P = I;
      Q = F;
    } else {
      b[d >> 0] = s;
      b[(d + 1) >> 0] = r;
      r =
        ((h[(k + 1) >> 0] | 0) << 3) |
        (h[k >> 0] | 0) |
        ((h[(k + 2) >> 0] | 0) << 6);
      s =
        ((h[(k + 3) >> 0] | 0) << 9) |
        r |
        ((h[(k + 4) >> 0] | 0) << 12) |
        ((h[(k + 5) >> 0] | 0) << 15);
      F = ((h[(k + 6) >> 0] | 0) << 18) | s | ((h[(k + 7) >> 0] | 0) << 21);
      b[(d + 2) >> 0] = r;
      b[(d + 3) >> 0] = s >>> 8;
      b[(d + 4) >> 0] = F >>> 16;
      F =
        ((h[(k + 9) >> 0] | 0) << 3) |
        (h[(k + 8) >> 0] | 0) |
        ((h[(k + 10) >> 0] | 0) << 6);
      s =
        ((h[(k + 11) >> 0] | 0) << 9) |
        F |
        ((h[(k + 12) >> 0] | 0) << 12) |
        ((h[(k + 13) >> 0] | 0) << 15);
      O = ((h[(k + 14) >> 0] | 0) << 18) | s | ((h[(k + 15) >> 0] | 0) << 21);
      P = s;
      Q = F;
    }
    b[(d + 5) >> 0] = Q;
    b[(d + 6) >> 0] = P >>> 8;
    b[(d + 7) >> 0] = O >>> 16;
    u = e;
    return;
  }
  function Ta(a, c, d, e) {
    a = a | 0;
    c = c | 0;
    d = d | 0;
    e = e | 0;
    var f = 0,
      g = 0,
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
      z = 0;
    f = (d + 1) | 0;
    g = (d + 2) | 0;
    i = (d + 3) | 0;
    j = (d + 4) | 0;
    k = (d + 5) | 0;
    l = (d + 6) | 0;
    m = (d + 7) | 0;
    n = 0;
    o = 0;
    while (1) {
      if (!((1 << o) & c)) {
        b[(e + o) >> 0] = 0;
        p = n;
      } else {
        q = h[(a + ((o << 2) | 3)) >> 0] | 0;
        r = (q - (h[d >> 0] | 0)) | 0;
        s = W(r, r) | 0;
        r = (q - (h[f >> 0] | 0)) | 0;
        t = W(r, r) | 0;
        r = t >>> 0 < s >>> 0;
        u = r ? t : s;
        s = (q - (h[g >> 0] | 0)) | 0;
        t = W(s, s) | 0;
        s = (t | 0) < (u | 0);
        v = s ? t : u;
        u = (q - (h[i >> 0] | 0)) | 0;
        t = W(u, u) | 0;
        u = (t | 0) < (v | 0);
        w = u ? t : v;
        v = (q - (h[j >> 0] | 0)) | 0;
        t = W(v, v) | 0;
        v = (t | 0) < (w | 0);
        x = v ? t : w;
        w = (q - (h[k >> 0] | 0)) | 0;
        t = W(w, w) | 0;
        w = (t | 0) < (x | 0);
        y = w ? t : x;
        x = (q - (h[l >> 0] | 0)) | 0;
        t = W(x, x) | 0;
        x = (t | 0) < (y | 0);
        z = x ? t : y;
        y = (q - (h[m >> 0] | 0)) | 0;
        q = W(y, y) | 0;
        y = (q | 0) < (z | 0);
        b[(e + o) >> 0] = y ? 7 : x ? 6 : w ? 5 : v ? 4 : u ? 3 : s ? 2 : r & 1;
        p = ((y ? q : z) + n) | 0;
      }
      o = (o + 1) | 0;
      if ((o | 0) == 16) break;
      else n = p;
    }
    return p | 0;
  }
  function Ua(a, c) {
    a = a | 0;
    c = c | 0;
    var d = 0,
      e = 0,
      f = 0,
      g = 0,
      i = 0,
      j = 0,
      k = 0,
      l = 0;
    d = u;
    u = (u + 32) | 0;
    e = (d + 16) | 0;
    f = d;
    g = b[c >> 0] | 0;
    i = g & 255;
    j = b[(c + 1) >> 0] | 0;
    k = j & 255;
    b[e >> 0] = g;
    b[(e + 1) >> 0] = j;
    if ((g & 255) > (j & 255)) {
      b[(e + 2) >> 0] = ((((((i * 6) | 0) + k) | 0) >>> 0) / 7) | 0;
      b[(e + 3) >> 0] = ((((((i * 5) | 0) + (k << 1)) | 0) >>> 0) / 7) | 0;
      b[(e + 4) >> 0] = (((((i << 2) + ((k * 3) | 0)) | 0) >>> 0) / 7) | 0;
      b[(e + 5) >> 0] = ((((((i * 3) | 0) + (k << 2)) | 0) >>> 0) / 7) | 0;
      b[(e + 6) >> 0] = (((((i << 1) + ((k * 5) | 0)) | 0) >>> 0) / 7) | 0;
      l = (((((i + ((k * 6) | 0)) | 0) >>> 0) / 7) | 0) & 255;
    } else {
      b[(e + 2) >> 0] = (((((i << 2) + k) | 0) >>> 0) / 5) | 0;
      b[(e + 3) >> 0] = ((((((i * 3) | 0) + (k << 1)) | 0) >>> 0) / 5) | 0;
      b[(e + 4) >> 0] = (((((i << 1) + ((k * 3) | 0)) | 0) >>> 0) / 5) | 0;
      b[(e + 5) >> 0] = ((((i + (k << 2)) | 0) >>> 0) / 5) | 0;
      b[(e + 6) >> 0] = 0;
      l = -1;
    }
    b[(e + 7) >> 0] = l;
    l = h[(c + 2) >> 0] | 0;
    k = h[(c + 3) >> 0] | 0;
    i = k << 8;
    j = b[(c + 4) >> 0] | 0;
    g = j & 255;
    b[f >> 0] = l & 7;
    b[(f + 1) >> 0] = (l >>> 3) & 7;
    b[(f + 2) >> 0] = ((i | l) >>> 6) & 7;
    b[(f + 3) >> 0] = (k >>> 1) & 7;
    b[(f + 4) >> 0] = (k >>> 4) & 7;
    b[(f + 5) >> 0] = (((g << 16) | i) >>> 15) & 7;
    b[(f + 6) >> 0] = (g >>> 2) & 7;
    b[(f + 7) >> 0] = (j & 255) >>> 5;
    j = h[(c + 5) >> 0] | 0;
    g = h[(c + 6) >> 0] | 0;
    i = g << 8;
    k = b[(c + 7) >> 0] | 0;
    c = k & 255;
    b[(f + 8) >> 0] = j & 7;
    b[(f + 9) >> 0] = (j >>> 3) & 7;
    b[(f + 10) >> 0] = ((i | j) >>> 6) & 7;
    b[(f + 11) >> 0] = (g >>> 1) & 7;
    b[(f + 12) >> 0] = (g >>> 4) & 7;
    b[(f + 13) >> 0] = (((c << 16) | i) >>> 15) & 7;
    b[(f + 14) >> 0] = (c >>> 2) & 7;
    b[(f + 15) >> 0] = (k & 255) >>> 5;
    b[(a + 3) >> 0] = b[(e + (h[f >> 0] | 0)) >> 0] | 0;
    b[(a + 7) >> 0] = b[(e + (h[(f + 1) >> 0] | 0)) >> 0] | 0;
    b[(a + 11) >> 0] = b[(e + (h[(f + 2) >> 0] | 0)) >> 0] | 0;
    b[(a + 15) >> 0] = b[(e + (h[(f + 3) >> 0] | 0)) >> 0] | 0;
    b[(a + 19) >> 0] = b[(e + (h[(f + 4) >> 0] | 0)) >> 0] | 0;
    b[(a + 23) >> 0] = b[(e + (h[(f + 5) >> 0] | 0)) >> 0] | 0;
    b[(a + 27) >> 0] = b[(e + (h[(f + 6) >> 0] | 0)) >> 0] | 0;
    b[(a + 31) >> 0] = b[(e + (h[(f + 7) >> 0] | 0)) >> 0] | 0;
    b[(a + 35) >> 0] = b[(e + (h[(f + 8) >> 0] | 0)) >> 0] | 0;
    b[(a + 39) >> 0] = b[(e + (h[(f + 9) >> 0] | 0)) >> 0] | 0;
    b[(a + 43) >> 0] = b[(e + (h[(f + 10) >> 0] | 0)) >> 0] | 0;
    b[(a + 47) >> 0] = b[(e + (h[(f + 11) >> 0] | 0)) >> 0] | 0;
    b[(a + 51) >> 0] = b[(e + (h[(f + 12) >> 0] | 0)) >> 0] | 0;
    b[(a + 55) >> 0] = b[(e + (h[(f + 13) >> 0] | 0)) >> 0] | 0;
    b[(a + 59) >> 0] = b[(e + (h[(f + 14) >> 0] | 0)) >> 0] | 0;
    b[(a + 63) >> 0] = b[(e + (h[(f + 15) >> 0] | 0)) >> 0] | 0;
    u = d;
    return;
  }
  function Va(a, c) {
    a = a | 0;
    c = c | 0;
    var d = 0,
      e = 0,
      g = 0,
      i = 0,
      j = 0,
      k = 0,
      l = 0,
      m = 0,
      o = 0,
      p = 0,
      q = 0,
      r = 0,
      s = 0,
      t = 0,
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
      J = 0,
      K = 0,
      L = 0,
      M = 0.0,
      N = 0.0,
      O = 0.0,
      P = 0.0,
      Q = 0.0,
      R = 0.0,
      S = 0.0,
      T = 0.0,
      U = 0.0,
      W = 0.0,
      X = 0.0,
      Y = 0.0,
      Z = 0.0,
      _ = 0.0,
      $ = 0.0,
      aa = 0.0,
      ba = 0.0,
      ca = 0,
      da = 0,
      ea = 0,
      fa = 0,
      ga = 0.0,
      ha = 0.0,
      ia = 0.0,
      ja = 0.0,
      ka = 0.0,
      la = 0.0,
      ma = 0.0,
      na = 0.0,
      oa = 0.0,
      pa = 0.0,
      qa = 0.0,
      ra = 0.0,
      sa = 0.0,
      ta = 0.0,
      ua = 0,
      va = 0.0,
      wa = 0.0,
      xa = 0.0,
      ya = 0.0,
      za = 0,
      Aa = 0,
      Ba = 0,
      Ca = 0.0,
      Da = 0.0,
      Ea = 0.0,
      Fa = 0.0,
      Ga = 0.0,
      Ha = 0.0,
      Ia = 0.0,
      Ja = 0.0,
      Ka = 0.0,
      La = 0.0,
      Ma = 0.0,
      Na = 0.0,
      Oa = 0.0,
      Pa = 0.0,
      Qa = 0.0,
      Ra = 0.0,
      Sa = 0.0,
      Ta = 0.0,
      Ua = 0.0,
      Va = 0.0,
      Wa = 0.0,
      Ya = 0.0,
      _a = 0.0,
      $a = 0.0,
      ab = 0.0,
      bb = 0.0,
      cb = 0.0,
      eb = 0.0,
      fb = 0.0,
      gb = 0.0,
      hb = 0.0,
      ib = 0.0,
      jb = 0.0,
      kb = 0.0,
      lb = 0.0,
      mb = 0.0,
      nb = 0,
      ob = 0,
      pb = 0,
      qb = 0.0,
      rb = 0.0,
      sb = 0.0,
      tb = 0.0,
      ub = 0.0,
      vb = 0.0,
      wb = 0.0,
      xb = 0.0,
      yb = 0.0,
      zb = 0.0,
      Ab = 0,
      Bb = 0,
      Cb = 0,
      Db = 0.0,
      Eb = 0.0,
      Fb = 0.0,
      Gb = 0.0,
      Hb = 0.0,
      Ib = 0.0,
      Jb = 0.0,
      Kb = 0.0,
      Lb = 0.0,
      Mb = 0.0,
      Nb = 0;
    d = u;
    u = (u + 64) | 0;
    e = (d + 40) | 0;
    g = (d + 24) | 0;
    i = (d + 12) | 0;
    j = d;
    k = (a + 4) | 0;
    l = f[f[k >> 2] >> 2] | 0;
    Xa(a, (a + 16) | 0, 0) | 0;
    m = (a + 444) | 0;
    o = (a + 448) | 0;
    p = (a + 452) | 0;
    q = (a + 456) | 0;
    r = (l | 0) > 0;
    s = (a + 12) | 0;
    t = (g + 4) | 0;
    v = (g + 8) | 0;
    w = (a + 156) | 0;
    x = (a + 160) | 0;
    y = (a + 164) | 0;
    z = (a + 168) | 0;
    A = (a + 412) | 0;
    B = (a + 416) | 0;
    C = (a + 420) | 0;
    D = (a + 424) | 0;
    E = (a + 428) | 0;
    F = (a + 432) | 0;
    G = (a + 436) | 0;
    H = 0;
    J = 0;
    K = 0;
    L = 0;
    M = +n[m >> 2];
    N = +n[p >> 2];
    O = +n[q >> 2];
    P = +n[o >> 2];
    Q = 0.0;
    R = 0.0;
    S = 0.0;
    T = 0.0;
    U = 0.0;
    W = 0.0;
    while (1) {
      if (r) {
        X = +n[A >> 2];
        Y = +n[B >> 2];
        Z = +n[C >> 2];
        _ = +n[D >> 2];
        $ = +n[E >> 2];
        aa = +n[F >> 2];
        ba = +n[G >> 2];
        ca = 0;
        da = H;
        ea = J;
        fa = L;
        ga = 0.0;
        ha = M;
        ia = N;
        ja = 0.0;
        ka = O;
        la = 0.0;
        ma = 0.0;
        na = P;
        oa = W;
        pa = U;
        qa = T;
        ra = S;
        sa = R;
        ta = Q;
        while (1) {
          ua = (ca | 0) == 0;
          if (ua) {
            va = +n[w >> 2];
            wa = +n[x >> 2];
            xa = +n[y >> 2];
            ya = +n[z >> 2];
          } else {
            va = 0.0;
            wa = 0.0;
            xa = 0.0;
            ya = 0.0;
          }
          za = ua ? 1 : ca;
          ua = da;
          Aa = ea;
          Ba = fa;
          Ca = va;
          Da = ha;
          Ea = wa;
          Fa = ia;
          Ga = ka;
          Ha = xa;
          Ia = ya;
          Ja = na;
          Ka = ta;
          La = sa;
          Ma = ra;
          Na = qa;
          Oa = pa;
          Pa = oa;
          while (1) {
            Qa = Ca * 0.5;
            Ra = Ea * 0.5;
            Sa = Ha * 0.5;
            Ta = Ia * 0.25;
            Ua = ga + Qa;
            Va = ma + Ra;
            Wa = ja + Sa;
            Ya = la + Ta;
            _a = Qa + (X - Ca - ga);
            Qa = Ra + (Y - Ea - ma);
            Ra = Sa + (Z - Ha - ja);
            Sa = Ta + (_ - Ia - la);
            $a = 1.0 / (Ya * Sa - Ta * Ta);
            ab = (Ua * Sa - Ta * _a) * $a;
            bb = (Va * Sa - Ta * Qa) * $a;
            cb = (Wa * Sa - Ta * Ra) * $a;
            eb = (Ya * _a - Ua * Ta) * $a;
            fb = (Ya * Qa - Va * Ta) * $a;
            gb = (Ya * Ra - Wa * Ta) * $a;
            $a = ab > 0.0 ? ab : 0.0;
            ab = bb > 0.0 ? bb : 0.0;
            bb = cb > 0.0 ? cb : 0.0;
            cb = eb > 0.0 ? eb : 0.0;
            eb = fb > 0.0 ? fb : 0.0;
            fb = gb > 0.0 ? gb : 0.0;
            gb = ($a < 1.0 ? $a : 1.0) * 31.0 + 0.5;
            $a = (ab < 1.0 ? ab : 1.0) * 63.0 + 0.5;
            ab = (bb < 1.0 ? bb : 1.0) * 31.0 + 0.5;
            if (gb > 0.0) hb = +I(+gb);
            else hb = +V(+gb);
            if ($a > 0.0) ib = +I(+$a);
            else ib = +V(+$a);
            if (ab > 0.0) jb = +I(+ab);
            else jb = +V(+ab);
            ab = hb * 0.032258063554763794;
            $a = ib * 0.01587301678955555;
            gb = jb * 0.032258063554763794;
            bb = (cb < 1.0 ? cb : 1.0) * 31.0 + 0.5;
            cb = (eb < 1.0 ? eb : 1.0) * 63.0 + 0.5;
            eb = (fb < 1.0 ? fb : 1.0) * 31.0 + 0.5;
            if (bb > 0.0) kb = +I(+bb);
            else kb = +V(+bb);
            if (cb > 0.0) lb = +I(+cb);
            else lb = +V(+cb);
            if (eb > 0.0) mb = +I(+eb);
            else mb = +V(+eb);
            eb = kb * 0.032258063554763794;
            cb = lb * 0.01587301678955555;
            bb = mb * 0.032258063554763794;
            fb =
              $ *
                (Ya * (ab * ab) +
                  Sa * (eb * eb) +
                  (Ta * (ab * eb) - Ua * ab - _a * eb) * 2.0) +
              aa *
                (Ya * ($a * $a) +
                  Sa * (cb * cb) +
                  (Ta * ($a * cb) - Va * $a - Qa * cb) * 2.0) +
              ba *
                (Ya * (gb * gb) +
                  Sa * (bb * bb) +
                  (Ta * (gb * bb) - Wa * gb - Ra * bb) * 2.0);
            if (!((fb < Da) | (fb < Ja)) ? !((fb < Fa) | (fb < Ga)) : 0) {
              nb = ua;
              ob = Aa;
              pb = Ba;
              qb = Da;
              rb = Fa;
              sb = Ga;
              tb = Ja;
              ub = Ka;
              vb = La;
              wb = Ma;
              xb = Na;
              yb = Oa;
              zb = Pa;
            } else {
              nb = K;
              ob = ca;
              pb = za;
              qb = fb;
              rb = fb;
              sb = fb;
              tb = fb;
              ub = eb;
              vb = cb;
              wb = bb;
              xb = ab;
              yb = $a;
              zb = gb;
            }
            if ((za | 0) == (l | 0)) break;
            gb = Ca + +n[(a + 156 + (za << 4)) >> 2];
            $a = Ea + +n[(a + 156 + (za << 4) + 4) >> 2];
            ab = Ha + +n[(a + 156 + (za << 4) + 8) >> 2];
            bb = Ia + +n[(a + 156 + (za << 4) + 12) >> 2];
            za = (za + 1) | 0;
            ua = nb;
            Aa = ob;
            Ba = pb;
            Ca = gb;
            Da = qb;
            Ea = $a;
            Fa = rb;
            Ga = sb;
            Ha = ab;
            Ia = bb;
            Ja = tb;
            Ka = ub;
            La = vb;
            Ma = wb;
            Na = xb;
            Oa = yb;
            Pa = zb;
          }
          ga = ga + +n[(a + 156 + (ca << 4)) >> 2];
          ma = ma + +n[(a + 156 + (ca << 4) + 4) >> 2];
          ja = ja + +n[(a + 156 + (ca << 4) + 8) >> 2];
          la = la + +n[(a + 156 + (ca << 4) + 12) >> 2];
          ca = (ca + 1) | 0;
          if ((ca | 0) == (l | 0)) {
            Ab = nb;
            Bb = ob;
            Cb = pb;
            Db = zb;
            Eb = yb;
            Fb = xb;
            Gb = wb;
            Hb = vb;
            Ib = ub;
            Jb = qb;
            Kb = rb;
            Lb = sb;
            Mb = tb;
            break;
          } else {
            da = nb;
            ea = ob;
            fa = pb;
            ha = qb;
            ia = rb;
            ka = sb;
            na = tb;
            oa = zb;
            pa = yb;
            qa = xb;
            ra = wb;
            sa = vb;
            ta = ub;
          }
        }
      } else {
        Ab = H;
        Bb = J;
        Cb = L;
        Db = W;
        Eb = U;
        Fb = T;
        Gb = S;
        Hb = R;
        Ib = Q;
        Jb = M;
        Kb = N;
        Lb = O;
        Mb = P;
      }
      if ((Ab | 0) != (K | 0)) {
        Nb = Ab;
        break;
      }
      fa = (K + 1) | 0;
      if ((fa | 0) == (f[s >> 2] | 0)) {
        Nb = K;
        break;
      }
      n[g >> 2] = Ib - Fb;
      n[t >> 2] = Hb - Eb;
      n[v >> 2] = Gb - Db;
      if (Xa(a, g, fa) | 0) {
        ea = K;
        J = Bb;
        K = fa;
        L = Cb;
        M = Jb;
        N = Kb;
        O = Lb;
        P = Mb;
        Q = Ib;
        R = Hb;
        S = Gb;
        T = Fb;
        U = Eb;
        W = Db;
        H = ea;
      } else {
        Nb = K;
        break;
      }
    }
    if (
      ((!(Jb < +n[m >> 2]) ? !(Mb < +n[o >> 2]) : 0) ? !(Kb < +n[p >> 2]) : 0)
        ? !(Lb < +n[q >> 2])
        : 0
    ) {
      u = d;
      return;
    }
    K = ((Nb << 4) + (a + 28)) | 0;
    if ((Bb | 0) > 0) {
      a = 0;
      do {
        b[(g + (h[(K + a) >> 0] | 0)) >> 0] = 0;
        a = (a + 1) | 0;
      } while ((a | 0) != (Bb | 0));
    }
    if ((Bb | 0) < (Cb | 0)) {
      a = Bb;
      do {
        b[(g + (h[(K + a) >> 0] | 0)) >> 0] = 2;
        a = (a + 1) | 0;
      } while ((a | 0) != (Cb | 0));
    }
    if ((Cb | 0) < (l | 0)) {
      a = Cb;
      do {
        b[(g + (h[(K + a) >> 0] | 0)) >> 0] = 1;
        a = (a + 1) | 0;
      } while ((a | 0) != (l | 0));
    }
    db(f[k >> 2] | 0, g, e);
    n[i >> 2] = Fb;
    n[(i + 4) >> 2] = Eb;
    n[(i + 8) >> 2] = Db;
    n[j >> 2] = Ib;
    n[(j + 4) >> 2] = Hb;
    n[(j + 8) >> 2] = Gb;
    Za(i, j, e, c);
    n[m >> 2] = Jb;
    n[o >> 2] = Mb;
    n[p >> 2] = Kb;
    n[q >> 2] = Lb;
    u = d;
    return;
  }
  function Wa(a, c) {
    a = a | 0;
    c = c | 0;
    var d = 0,
      e = 0,
      g = 0,
      i = 0,
      j = 0,
      k = 0,
      l = 0,
      m = 0,
      o = 0,
      p = 0,
      q = 0,
      r = 0,
      s = 0,
      t = 0,
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
      J = 0,
      K = 0,
      L = 0,
      M = 0,
      N = 0.0,
      O = 0.0,
      P = 0.0,
      Q = 0.0,
      R = 0.0,
      S = 0.0,
      T = 0.0,
      U = 0.0,
      W = 0.0,
      X = 0.0,
      Y = 0.0,
      Z = 0.0,
      _ = 0.0,
      $ = 0.0,
      aa = 0.0,
      ba = 0.0,
      ca = 0.0,
      da = 0,
      ea = 0,
      fa = 0,
      ga = 0,
      ha = 0,
      ia = 0.0,
      ja = 0.0,
      ka = 0.0,
      la = 0.0,
      ma = 0.0,
      na = 0.0,
      oa = 0.0,
      pa = 0.0,
      qa = 0.0,
      ra = 0.0,
      sa = 0.0,
      ta = 0.0,
      ua = 0.0,
      va = 0.0,
      wa = 0,
      xa = 0,
      ya = 0,
      za = 0,
      Aa = 0,
      Ba = 0.0,
      Ca = 0.0,
      Da = 0.0,
      Ea = 0.0,
      Fa = 0.0,
      Ga = 0.0,
      Ha = 0.0,
      Ia = 0.0,
      Ja = 0.0,
      Ka = 0.0,
      La = 0.0,
      Ma = 0.0,
      Na = 0.0,
      Oa = 0.0,
      Pa = 0,
      Qa = 0.0,
      Ra = 0.0,
      Sa = 0.0,
      Ta = 0.0,
      Ua = 0.0,
      Va = 0.0,
      Wa = 0.0,
      Ya = 0.0,
      Za = 0.0,
      $a = 0.0,
      ab = 0.0,
      bb = 0.0,
      cb = 0,
      eb = 0,
      fb = 0,
      gb = 0,
      hb = 0.0,
      ib = 0.0,
      jb = 0.0,
      kb = 0.0,
      lb = 0.0,
      mb = 0.0,
      nb = 0.0,
      ob = 0.0,
      pb = 0.0,
      qb = 0.0,
      rb = 0.0,
      sb = 0.0,
      tb = 0.0,
      ub = 0.0,
      vb = 0.0,
      wb = 0.0,
      xb = 0.0,
      yb = 0.0,
      zb = 0.0,
      Ab = 0.0,
      Bb = 0.0,
      Cb = 0.0,
      Db = 0.0,
      Eb = 0.0,
      Fb = 0.0,
      Gb = 0.0,
      Hb = 0.0,
      Ib = 0.0,
      Jb = 0.0,
      Kb = 0.0,
      Lb = 0.0,
      Mb = 0.0,
      Nb = 0.0,
      Ob = 0.0,
      Pb = 0.0,
      Qb = 0.0,
      Rb = 0,
      Sb = 0,
      Tb = 0,
      Ub = 0,
      Vb = 0.0,
      Wb = 0.0,
      Xb = 0.0,
      Yb = 0.0,
      Zb = 0.0,
      _b = 0.0,
      $b = 0.0,
      ac = 0.0,
      bc = 0.0,
      cc = 0.0,
      dc = 0,
      ec = 0,
      fc = 0,
      gc = 0,
      hc = 0.0,
      ic = 0.0,
      jc = 0.0,
      kc = 0.0,
      lc = 0.0,
      mc = 0.0,
      nc = 0.0,
      oc = 0.0,
      pc = 0.0,
      qc = 0.0,
      rc = 0;
    d = u;
    u = (u + 64) | 0;
    e = (d + 40) | 0;
    g = (d + 24) | 0;
    i = (d + 12) | 0;
    j = d;
    k = (a + 4) | 0;
    l = f[f[k >> 2] >> 2] | 0;
    Xa(a, (a + 16) | 0, 0) | 0;
    m = (a + 444) | 0;
    o = (a + 448) | 0;
    p = (a + 452) | 0;
    q = (a + 456) | 0;
    r = (l | 0) > 0;
    s = (a + 12) | 0;
    t = (g + 4) | 0;
    v = (g + 8) | 0;
    w = (a + 156) | 0;
    x = (a + 160) | 0;
    y = (a + 164) | 0;
    z = (a + 168) | 0;
    A = (a + 412) | 0;
    B = (a + 416) | 0;
    C = (a + 420) | 0;
    D = (a + 424) | 0;
    E = (a + 428) | 0;
    F = (a + 432) | 0;
    G = (a + 436) | 0;
    H = 0;
    J = 0;
    K = 0;
    L = 0;
    M = 0;
    N = +n[m >> 2];
    O = +n[p >> 2];
    P = +n[q >> 2];
    Q = +n[o >> 2];
    R = 0.0;
    S = 0.0;
    T = 0.0;
    U = 0.0;
    W = 0.0;
    X = 0.0;
    while (1) {
      if (r) {
        Y = +n[A >> 2];
        Z = +n[B >> 2];
        _ = +n[C >> 2];
        $ = +n[D >> 2];
        aa = +n[E >> 2];
        ba = +n[F >> 2];
        ca = +n[G >> 2];
        da = 0;
        ea = J;
        fa = K;
        ga = L;
        ha = M;
        ia = 0.0;
        ja = N;
        ka = O;
        la = 0.0;
        ma = P;
        na = 0.0;
        oa = 0.0;
        pa = Q;
        qa = X;
        ra = W;
        sa = U;
        ta = T;
        ua = S;
        va = R;
        while (1) {
          wa = da;
          xa = ga;
          ya = ea;
          za = fa;
          Aa = ha;
          Ba = 0.0;
          Ca = ja;
          Da = ka;
          Ea = ma;
          Fa = 0.0;
          Ga = 0.0;
          Ha = pa;
          Ia = 0.0;
          Ja = va;
          Ka = ua;
          La = ta;
          Ma = sa;
          Na = ra;
          Oa = qa;
          while (1) {
            Pa = (wa | 0) == 0;
            if (Pa) {
              Qa = +n[w >> 2];
              Ra = +n[x >> 2];
              Sa = +n[y >> 2];
              Ta = +n[z >> 2];
            } else {
              Qa = 0.0;
              Ra = 0.0;
              Sa = 0.0;
              Ta = 0.0;
            }
            Ua = ia + Ba * 0.6666666865348816;
            Va = oa + Ia * 0.6666666865348816;
            Wa = la + Fa * 0.6666666865348816;
            Ya = na + Ga * 0.4444444477558136;
            Za = Ba * 0.3333333432674408;
            $a = Ia * 0.3333333432674408;
            ab = Fa * 0.3333333432674408;
            bb = Ga * 0.1111111119389534;
            cb = Pa ? 1 : wa;
            Pa = xa;
            eb = ya;
            fb = za;
            gb = Aa;
            hb = Qa;
            ib = Ca;
            jb = Ra;
            kb = Da;
            lb = Ea;
            mb = Sa;
            nb = Ta;
            ob = Ha;
            pb = Ja;
            qb = Ka;
            rb = La;
            sb = Ma;
            tb = Na;
            ub = Oa;
            while (1) {
              vb = Ua + hb * 0.3333333432674408;
              wb = Va + jb * 0.3333333432674408;
              xb = Wa + mb * 0.3333333432674408;
              yb = Ya + nb * 0.1111111119389534;
              zb = Za + (hb * 0.6666666865348816 + (Y - hb - Ba - ia));
              Ab = $a + (jb * 0.6666666865348816 + (Z - jb - Ia - oa));
              Bb = ab + (mb * 0.6666666865348816 + (_ - mb - Fa - la));
              Cb = bb + (nb * 0.4444444477558136 + ($ - nb - Ga - na));
              Db = (Ga + nb) * 0.2222222238779068;
              Eb = 1.0 / (yb * Cb - Db * Db);
              Fb = (vb * Cb - Db * zb) * Eb;
              Gb = (wb * Cb - Db * Ab) * Eb;
              Hb = (xb * Cb - Db * Bb) * Eb;
              Ib = (yb * zb - vb * Db) * Eb;
              Jb = (yb * Ab - wb * Db) * Eb;
              Kb = (yb * Bb - xb * Db) * Eb;
              Eb = Fb > 0.0 ? Fb : 0.0;
              Fb = Gb > 0.0 ? Gb : 0.0;
              Gb = Hb > 0.0 ? Hb : 0.0;
              Hb = Ib > 0.0 ? Ib : 0.0;
              Ib = Jb > 0.0 ? Jb : 0.0;
              Jb = Kb > 0.0 ? Kb : 0.0;
              Kb = (Eb < 1.0 ? Eb : 1.0) * 31.0 + 0.5;
              Eb = (Fb < 1.0 ? Fb : 1.0) * 63.0 + 0.5;
              Fb = (Gb < 1.0 ? Gb : 1.0) * 31.0 + 0.5;
              if (Kb > 0.0) Lb = +I(+Kb);
              else Lb = +V(+Kb);
              if (Eb > 0.0) Mb = +I(+Eb);
              else Mb = +V(+Eb);
              if (Fb > 0.0) Nb = +I(+Fb);
              else Nb = +V(+Fb);
              Fb = Lb * 0.032258063554763794;
              Eb = Mb * 0.01587301678955555;
              Kb = Nb * 0.032258063554763794;
              Gb = (Hb < 1.0 ? Hb : 1.0) * 31.0 + 0.5;
              Hb = (Ib < 1.0 ? Ib : 1.0) * 63.0 + 0.5;
              Ib = (Jb < 1.0 ? Jb : 1.0) * 31.0 + 0.5;
              if (Gb > 0.0) Ob = +I(+Gb);
              else Ob = +V(+Gb);
              if (Hb > 0.0) Pb = +I(+Hb);
              else Pb = +V(+Hb);
              if (Ib > 0.0) Qb = +I(+Ib);
              else Qb = +V(+Ib);
              Ib = Ob * 0.032258063554763794;
              Hb = Pb * 0.01587301678955555;
              Gb = Qb * 0.032258063554763794;
              Jb =
                aa *
                  (yb * (Fb * Fb) +
                    Cb * (Ib * Ib) +
                    (Db * (Fb * Ib) - vb * Fb - zb * Ib) * 2.0) +
                ba *
                  (yb * (Eb * Eb) +
                    Cb * (Hb * Hb) +
                    (Db * (Eb * Hb) - wb * Eb - Ab * Hb) * 2.0) +
                ca *
                  (yb * (Kb * Kb) +
                    Cb * (Gb * Gb) +
                    (Db * (Kb * Gb) - xb * Kb - Bb * Gb) * 2.0);
              if (!((Jb < ib) | (Jb < ob)) ? !((Jb < kb) | (Jb < lb)) : 0) {
                Rb = Pa;
                Sb = eb;
                Tb = fb;
                Ub = gb;
                Vb = ib;
                Wb = kb;
                Xb = lb;
                Yb = ob;
                Zb = pb;
                _b = qb;
                $b = rb;
                ac = sb;
                bc = tb;
                cc = ub;
              } else {
                Rb = H;
                Sb = cb;
                Tb = wa;
                Ub = da;
                Vb = Jb;
                Wb = Jb;
                Xb = Jb;
                Yb = Jb;
                Zb = Ib;
                _b = Hb;
                $b = Gb;
                ac = Fb;
                bc = Eb;
                cc = Kb;
              }
              if ((cb | 0) == (l | 0)) break;
              Kb = hb + +n[(a + 156 + (cb << 4)) >> 2];
              Eb = jb + +n[(a + 156 + (cb << 4) + 4) >> 2];
              Fb = mb + +n[(a + 156 + (cb << 4) + 8) >> 2];
              Gb = nb + +n[(a + 156 + (cb << 4) + 12) >> 2];
              cb = (cb + 1) | 0;
              Pa = Rb;
              eb = Sb;
              fb = Tb;
              gb = Ub;
              hb = Kb;
              ib = Vb;
              jb = Eb;
              kb = Wb;
              lb = Xb;
              mb = Fb;
              nb = Gb;
              ob = Yb;
              pb = Zb;
              qb = _b;
              rb = $b;
              sb = ac;
              tb = bc;
              ub = cc;
            }
            if ((wa | 0) == (l | 0)) break;
            ub = Ba + +n[(a + 156 + (wa << 4)) >> 2];
            tb = Ia + +n[(a + 156 + (wa << 4) + 4) >> 2];
            sb = Fa + +n[(a + 156 + (wa << 4) + 8) >> 2];
            rb = Ga + +n[(a + 156 + (wa << 4) + 12) >> 2];
            wa = (wa + 1) | 0;
            xa = Rb;
            ya = Sb;
            za = Tb;
            Aa = Ub;
            Ba = ub;
            Ca = Vb;
            Da = Wb;
            Ea = Xb;
            Fa = sb;
            Ga = rb;
            Ha = Yb;
            Ia = tb;
            Ja = Zb;
            Ka = _b;
            La = $b;
            Ma = ac;
            Na = bc;
            Oa = cc;
          }
          ia = ia + +n[(a + 156 + (da << 4)) >> 2];
          oa = oa + +n[(a + 156 + (da << 4) + 4) >> 2];
          la = la + +n[(a + 156 + (da << 4) + 8) >> 2];
          na = na + +n[(a + 156 + (da << 4) + 12) >> 2];
          da = (da + 1) | 0;
          if ((da | 0) == (l | 0)) {
            dc = Rb;
            ec = Sb;
            fc = Tb;
            gc = Ub;
            hc = cc;
            ic = bc;
            jc = ac;
            kc = $b;
            lc = _b;
            mc = Zb;
            nc = Vb;
            oc = Wb;
            pc = Xb;
            qc = Yb;
            break;
          } else {
            ea = Sb;
            fa = Tb;
            ga = Rb;
            ha = Ub;
            ja = Vb;
            ka = Wb;
            ma = Xb;
            pa = Yb;
            qa = cc;
            ra = bc;
            sa = ac;
            ta = $b;
            ua = _b;
            va = Zb;
          }
        }
      } else {
        dc = L;
        ec = J;
        fc = K;
        gc = M;
        hc = X;
        ic = W;
        jc = U;
        kc = T;
        lc = S;
        mc = R;
        nc = N;
        oc = O;
        pc = P;
        qc = Q;
      }
      if ((dc | 0) != (H | 0)) {
        rc = dc;
        break;
      }
      ha = (H + 1) | 0;
      if ((ha | 0) == (f[s >> 2] | 0)) {
        rc = H;
        break;
      }
      n[g >> 2] = mc - jc;
      n[t >> 2] = lc - ic;
      n[v >> 2] = kc - hc;
      if (Xa(a, g, ha) | 0) {
        ga = H;
        H = ha;
        J = ec;
        K = fc;
        M = gc;
        N = nc;
        O = oc;
        P = pc;
        Q = qc;
        R = mc;
        S = lc;
        T = kc;
        U = jc;
        W = ic;
        X = hc;
        L = ga;
      } else {
        rc = H;
        break;
      }
    }
    if (
      ((!(nc < +n[m >> 2]) ? !(qc < +n[o >> 2]) : 0) ? !(oc < +n[p >> 2]) : 0)
        ? !(pc < +n[q >> 2])
        : 0
    ) {
      u = d;
      return;
    }
    H = ((rc << 4) + (a + 28)) | 0;
    if ((gc | 0) > 0) {
      a = 0;
      do {
        b[(g + (h[(H + a) >> 0] | 0)) >> 0] = 0;
        a = (a + 1) | 0;
      } while ((a | 0) != (gc | 0));
    }
    if ((gc | 0) < (fc | 0)) {
      a = gc;
      do {
        b[(g + (h[(H + a) >> 0] | 0)) >> 0] = 2;
        a = (a + 1) | 0;
      } while ((a | 0) != (fc | 0));
    }
    if ((fc | 0) < (ec | 0)) {
      a = fc;
      do {
        b[(g + (h[(H + a) >> 0] | 0)) >> 0] = 3;
        a = (a + 1) | 0;
      } while ((a | 0) != (ec | 0));
    }
    if ((ec | 0) < (l | 0)) {
      a = ec;
      do {
        b[(g + (h[(H + a) >> 0] | 0)) >> 0] = 1;
        a = (a + 1) | 0;
      } while ((a | 0) != (l | 0));
    }
    db(f[k >> 2] | 0, g, e);
    n[i >> 2] = jc;
    n[(i + 4) >> 2] = ic;
    n[(i + 8) >> 2] = hc;
    n[j >> 2] = mc;
    n[(j + 4) >> 2] = lc;
    n[(j + 8) >> 2] = kc;
    _a(i, j, e, c);
    n[m >> 2] = nc;
    n[o >> 2] = qc;
    n[p >> 2] = oc;
    n[q >> 2] = pc;
    u = d;
    return;
  }
  function Xa(a, c, d) {
    a = a | 0;
    c = c | 0;
    d = d | 0;
    var e = 0,
      g = 0,
      i = 0,
      j = 0,
      k = 0,
      l = 0,
      m = 0,
      o = 0,
      p = 0,
      q = 0,
      r = 0.0,
      t = 0.0,
      v = 0,
      w = 0,
      x = 0,
      y = 0,
      z = 0,
      A = 0.0,
      B = 0.0;
    e = u;
    u = (u + 64) | 0;
    g = e;
    i = (a + 4) | 0;
    j = f[i >> 2] | 0;
    k = f[j >> 2] | 0;
    l = ((d << 4) + (a + 28)) | 0;
    m = (k | 0) > 0;
    if (m) {
      o = (c + 4) | 0;
      p = (c + 8) | 0;
      q = 0;
      do {
        n[(g + (q << 2)) >> 2] =
          +n[(j + 4 + ((q * 12) | 0)) >> 2] * +n[c >> 2] +
          +n[(j + 4 + ((q * 12) | 0) + 4) >> 2] * +n[o >> 2] +
          +n[(j + 4 + ((q * 12) | 0) + 8) >> 2] * +n[p >> 2];
        b[(l + q) >> 0] = q;
        q = (q + 1) | 0;
      } while ((q | 0) != (k | 0));
      if (m) {
        q = 0;
        do {
          a: do
            if ((q | 0) > 0) {
              p = q;
              r = +n[(g + (q << 2)) >> 2];
              while (1) {
                j = p;
                p = (p + -1) | 0;
                o = (g + (p << 2)) | 0;
                t = +n[o >> 2];
                if (!(r < t)) break a;
                c = (g + (j << 2)) | 0;
                v = f[c >> 2] | 0;
                n[c >> 2] = t;
                f[o >> 2] = v;
                o = (l + j) | 0;
                c = (l + p) | 0;
                w = b[o >> 0] | 0;
                b[o >> 0] = b[c >> 0] | 0;
                b[c >> 0] = w;
                if ((j | 0) <= 1) break;
                else r = ((f[s >> 2] = v), +n[s >> 2]);
              }
            }
          while (0);
          q = (q + 1) | 0;
        } while ((q | 0) != (k | 0));
      }
    }
    b: do
      if ((d | 0) > 0) {
        if (m) x = 0;
        else {
          y = 0;
          u = e;
          return y | 0;
        }
        c: while (1) {
          q = ((x << 4) + (a + 28)) | 0;
          g = 0;
          while (1) {
            if ((b[(l + g) >> 0] | 0) != (b[(q + g) >> 0] | 0)) break;
            g = (g + 1) | 0;
            if ((g | 0) >= (k | 0)) {
              y = 0;
              break c;
            }
          }
          x = (x + 1) | 0;
          if ((x | 0) >= (d | 0)) break b;
        }
        u = e;
        return y | 0;
      }
    while (0);
    d = f[i >> 2] | 0;
    i = (a + 412) | 0;
    x = (a + 416) | 0;
    g = (a + 420) | 0;
    q = (a + 424) | 0;
    f[i >> 2] = 0;
    f[(i + 4) >> 2] = 0;
    f[(i + 8) >> 2] = 0;
    f[(i + 12) >> 2] = 0;
    if (m) z = 0;
    else {
      y = 1;
      u = e;
      return y | 0;
    }
    do {
      m = h[(l + z) >> 0] | 0;
      r = +n[(d + 196 + (m << 2)) >> 2];
      t = +n[(d + 4 + ((m * 12) | 0)) >> 2] * r;
      A = +n[(d + 4 + ((m * 12) | 0) + 4) >> 2] * r;
      B = +n[(d + 4 + ((m * 12) | 0) + 8) >> 2] * r;
      n[(a + 156 + (z << 4)) >> 2] = t;
      n[(a + 156 + (z << 4) + 4) >> 2] = A;
      n[(a + 156 + (z << 4) + 8) >> 2] = B;
      n[(a + 156 + (z << 4) + 12) >> 2] = r;
      n[i >> 2] = t + +n[i >> 2];
      n[x >> 2] = A + +n[x >> 2];
      n[g >> 2] = B + +n[g >> 2];
      n[q >> 2] = r + +n[q >> 2];
      z = (z + 1) | 0;
    } while ((z | 0) != (k | 0));
    y = 1;
    u = e;
    return y | 0;
  }
  function Ya(a, b, c) {
    a = a | 0;
    b = b | 0;
    c = c | 0;
    var d = 0,
      e = 0,
      g = 0,
      h = 0;
    d = u;
    u = (u + 48) | 0;
    e = (d + 16) | 0;
    g = d;
    ab(a, b, c);
    f[a >> 2] = 128;
    c = (a + 16) | 0;
    b = f[(a + 8) >> 2] | 0;
    f[(a + 12) >> 2] = (b & 256) | 0 ? 8 : 1;
    n[(a + 444) >> 2] = 3402823466385288598117041.0e14;
    n[(a + 448) >> 2] = 3402823466385288598117041.0e14;
    n[(a + 452) >> 2] = 3402823466385288598117041.0e14;
    n[(a + 456) >> 2] = 3402823466385288598117041.0e14;
    h = ((b & 32) | 0) == 0;
    n[(a + 428) >> 2] = h ? 1.0 : 0.2125999927520752;
    n[(a + 432) >> 2] = h ? 1.0 : 0.7152000069618225;
    n[(a + 436) >> 2] = h ? 1.0 : 0.0722000002861023;
    n[(a + 440) >> 2] = h ? 1.0 : 0.0;
    h = f[(a + 4) >> 2] | 0;
    eb(e, f[h >> 2] | 0, (h + 4) | 0, (h + 196) | 0);
    fb(g, e);
    f[c >> 2] = f[g >> 2];
    f[(c + 4) >> 2] = f[(g + 4) >> 2];
    f[(c + 8) >> 2] = f[(g + 8) >> 2];
    u = d;
    return;
  }
  function Za(a, c, d, e) {
    a = a | 0;
    c = c | 0;
    d = d | 0;
    e = e | 0;
    var f = 0,
      g = 0,
      h = 0,
      i = 0,
      j = 0,
      k = 0,
      l = 0,
      m = 0,
      o = 0,
      p = 0,
      q = 0,
      r = 0,
      s = 0,
      t = 0,
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
      J = 0,
      K = 0,
      L = 0,
      M = 0,
      N = 0,
      O = 0,
      P = 0,
      Q = 0,
      R = 0,
      S = 0,
      T = 0;
    f = u;
    u = (u + 16) | 0;
    g = f;
    h = ~~(+n[a >> 2] * 31.0 + 0.5);
    i = ~~(+n[(a + 4) >> 2] * 63.0 + 0.5);
    j = ~~(+n[(a + 8) >> 2] * 31.0 + 0.5);
    a =
      ((i | 0) < 0 ? 0 : ((i | 0) < 63 ? i : 63) << 5) |
      ((h | 0) < 0 ? 0 : ((h | 0) < 31 ? h : 31) << 11) |
      ((j | 0) < 0 ? 0 : (j | 0) < 31 ? j : 31);
    j = ~~(+n[c >> 2] * 31.0 + 0.5);
    h = ~~(+n[(c + 4) >> 2] * 63.0 + 0.5);
    i = ~~(+n[(c + 8) >> 2] * 31.0 + 0.5);
    c =
      ((h | 0) < 0 ? 0 : ((h | 0) < 63 ? h : 63) << 5) |
      ((j | 0) < 0 ? 0 : ((j | 0) < 31 ? j : 31) << 11) |
      ((i | 0) < 0 ? 0 : (i | 0) < 31 ? i : 31);
    if ((a | 0) > (c | 0)) {
      i = b[d >> 0] | 0;
      switch ((i << 24) >> 24) {
        case 0: {
          k = 1;
          break;
        }
        case 1: {
          k = 0;
          break;
        }
        default:
          k = i;
      }
      b[g >> 0] = k;
      i = b[(d + 1) >> 0] | 0;
      switch ((i << 24) >> 24) {
        case 0: {
          l = 1;
          break;
        }
        case 1: {
          l = 0;
          break;
        }
        default:
          l = i;
      }
      b[(g + 1) >> 0] = l;
      i = b[(d + 2) >> 0] | 0;
      switch ((i << 24) >> 24) {
        case 0: {
          m = 1;
          break;
        }
        case 1: {
          m = 0;
          break;
        }
        default:
          m = i;
      }
      b[(g + 2) >> 0] = m;
      i = b[(d + 3) >> 0] | 0;
      switch ((i << 24) >> 24) {
        case 0: {
          o = 1;
          break;
        }
        case 1: {
          o = 0;
          break;
        }
        default:
          o = i;
      }
      b[(g + 3) >> 0] = o;
      i = b[(d + 4) >> 0] | 0;
      switch ((i << 24) >> 24) {
        case 0: {
          p = 1;
          break;
        }
        case 1: {
          p = 0;
          break;
        }
        default:
          p = i;
      }
      b[(g + 4) >> 0] = p;
      i = b[(d + 5) >> 0] | 0;
      switch ((i << 24) >> 24) {
        case 0: {
          q = 1;
          break;
        }
        case 1: {
          q = 0;
          break;
        }
        default:
          q = i;
      }
      b[(g + 5) >> 0] = q;
      i = b[(d + 6) >> 0] | 0;
      switch ((i << 24) >> 24) {
        case 0: {
          r = 1;
          break;
        }
        case 1: {
          r = 0;
          break;
        }
        default:
          r = i;
      }
      b[(g + 6) >> 0] = r;
      i = b[(d + 7) >> 0] | 0;
      switch ((i << 24) >> 24) {
        case 0: {
          s = 1;
          break;
        }
        case 1: {
          s = 0;
          break;
        }
        default:
          s = i;
      }
      b[(g + 7) >> 0] = s;
      i = b[(d + 8) >> 0] | 0;
      switch ((i << 24) >> 24) {
        case 0: {
          t = 1;
          break;
        }
        case 1: {
          t = 0;
          break;
        }
        default:
          t = i;
      }
      b[(g + 8) >> 0] = t;
      i = b[(d + 9) >> 0] | 0;
      switch ((i << 24) >> 24) {
        case 0: {
          v = 1;
          break;
        }
        case 1: {
          v = 0;
          break;
        }
        default:
          v = i;
      }
      b[(g + 9) >> 0] = v;
      i = b[(d + 10) >> 0] | 0;
      switch ((i << 24) >> 24) {
        case 0: {
          w = 1;
          break;
        }
        case 1: {
          w = 0;
          break;
        }
        default:
          w = i;
      }
      b[(g + 10) >> 0] = w;
      i = b[(d + 11) >> 0] | 0;
      switch ((i << 24) >> 24) {
        case 0: {
          x = 1;
          break;
        }
        case 1: {
          x = 0;
          break;
        }
        default:
          x = i;
      }
      b[(g + 11) >> 0] = x;
      i = b[(d + 12) >> 0] | 0;
      switch ((i << 24) >> 24) {
        case 0: {
          y = 1;
          break;
        }
        case 1: {
          y = 0;
          break;
        }
        default:
          y = i;
      }
      b[(g + 12) >> 0] = y;
      i = b[(d + 13) >> 0] | 0;
      switch ((i << 24) >> 24) {
        case 0: {
          z = 1;
          break;
        }
        case 1: {
          z = 0;
          break;
        }
        default:
          z = i;
      }
      b[(g + 13) >> 0] = z;
      i = b[(d + 14) >> 0] | 0;
      switch ((i << 24) >> 24) {
        case 0: {
          A = 1;
          break;
        }
        case 1: {
          A = 0;
          break;
        }
        default:
          A = i;
      }
      b[(g + 14) >> 0] = A;
      i = b[(d + 15) >> 0] | 0;
      switch ((i << 24) >> 24) {
        case 0: {
          B = 1;
          break;
        }
        case 1: {
          B = 0;
          break;
        }
        default:
          B = i;
      }
      b[(g + 15) >> 0] = B;
      C = a;
      D = c;
      E = y;
      F = z;
      G = A;
      H = B;
      I = k;
      J = l;
      K = m;
      L = o;
      M = p;
      N = q;
      O = r;
      P = s;
      Q = t;
      R = v;
      S = w;
      T = x;
    } else {
      x = g;
      w = d;
      d = (x + 16) | 0;
      do {
        b[x >> 0] = b[w >> 0] | 0;
        x = (x + 1) | 0;
        w = (w + 1) | 0;
      } while ((x | 0) < (d | 0));
      C = c;
      D = a;
      E = b[(g + 12) >> 0] | 0;
      F = b[(g + 13) >> 0] | 0;
      G = b[(g + 14) >> 0] | 0;
      H = b[(g + 15) >> 0] | 0;
      I = b[g >> 0] | 0;
      J = b[(g + 1) >> 0] | 0;
      K = b[(g + 2) >> 0] | 0;
      L = b[(g + 3) >> 0] | 0;
      M = b[(g + 4) >> 0] | 0;
      N = b[(g + 5) >> 0] | 0;
      O = b[(g + 6) >> 0] | 0;
      P = b[(g + 7) >> 0] | 0;
      Q = b[(g + 8) >> 0] | 0;
      R = b[(g + 9) >> 0] | 0;
      S = b[(g + 10) >> 0] | 0;
      T = b[(g + 11) >> 0] | 0;
    }
    b[e >> 0] = D;
    b[(e + 1) >> 0] = D >>> 8;
    b[(e + 2) >> 0] = C;
    b[(e + 3) >> 0] = C >>> 8;
    b[(e + 4) >> 0] =
      ((J & 255) << 2) | (I & 255) | ((K & 255) << 4) | ((L & 255) << 6);
    b[(e + 5) >> 0] =
      ((N & 255) << 2) | (M & 255) | ((O & 255) << 4) | ((P & 255) << 6);
    b[(e + 6) >> 0] =
      ((R & 255) << 2) | (Q & 255) | ((S & 255) << 4) | ((T & 255) << 6);
    b[(e + 7) >> 0] =
      ((F & 255) << 2) | (E & 255) | ((G & 255) << 4) | ((H & 255) << 6);
    u = f;
    return;
  }
  function _a(a, c, d, e) {
    a = a | 0;
    c = c | 0;
    d = d | 0;
    e = e | 0;
    var f = 0,
      g = 0,
      h = 0,
      i = 0,
      j = 0,
      k = 0,
      l = 0,
      m = 0,
      o = 0,
      p = 0,
      q = 0,
      r = 0,
      s = 0,
      t = 0,
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
      J = 0,
      K = 0,
      L = 0,
      M = 0,
      N = 0,
      O = 0,
      P = 0,
      Q = 0,
      R = 0,
      S = 0;
    f = u;
    u = (u + 16) | 0;
    g = f;
    h = ~~(+n[a >> 2] * 31.0 + 0.5);
    i = ~~(+n[(a + 4) >> 2] * 63.0 + 0.5);
    j = ~~(+n[(a + 8) >> 2] * 31.0 + 0.5);
    a =
      ((i | 0) < 0 ? 0 : ((i | 0) < 63 ? i : 63) << 5) |
      ((h | 0) < 0 ? 0 : ((h | 0) < 31 ? h : 31) << 11) |
      ((j | 0) < 0 ? 0 : (j | 0) < 31 ? j : 31);
    j = ~~(+n[c >> 2] * 31.0 + 0.5);
    h = ~~(+n[(c + 4) >> 2] * 63.0 + 0.5);
    i = ~~(+n[(c + 8) >> 2] * 31.0 + 0.5);
    c =
      ((h | 0) < 0 ? 0 : ((h | 0) < 63 ? h : 63) << 5) |
      ((j | 0) < 0 ? 0 : ((j | 0) < 31 ? j : 31) << 11) |
      ((i | 0) < 0 ? 0 : (i | 0) < 31 ? i : 31);
    do
      if ((a | 0) >= (c | 0))
        if ((a | 0) == (c | 0)) {
          k = g;
          l = (k + 16) | 0;
          do {
            b[k >> 0] = 0;
            k = (k + 1) | 0;
          } while ((k | 0) < (l | 0));
          m = a;
          o = a;
          p = 0;
          q = 0;
          r = 0;
          s = 0;
          t = 0;
          v = 0;
          w = 0;
          x = 0;
          y = 0;
          z = 0;
          A = 0;
          B = 0;
          C = 0;
          D = 0;
          E = 0;
          F = 0;
          break;
        } else {
          k = g;
          i = d;
          l = (k + 16) | 0;
          do {
            b[k >> 0] = b[i >> 0] | 0;
            k = (k + 1) | 0;
            i = (i + 1) | 0;
          } while ((k | 0) < (l | 0));
          m = c;
          o = a;
          p = b[g >> 0] | 0;
          q = b[(g + 1) >> 0] | 0;
          r = b[(g + 2) >> 0] | 0;
          s = b[(g + 3) >> 0] | 0;
          t = b[(g + 4) >> 0] | 0;
          v = b[(g + 5) >> 0] | 0;
          w = b[(g + 6) >> 0] | 0;
          x = b[(g + 7) >> 0] | 0;
          y = b[(g + 8) >> 0] | 0;
          z = b[(g + 9) >> 0] | 0;
          A = b[(g + 10) >> 0] | 0;
          B = b[(g + 11) >> 0] | 0;
          C = b[(g + 12) >> 0] | 0;
          D = b[(g + 13) >> 0] | 0;
          E = b[(g + 14) >> 0] | 0;
          F = b[(g + 15) >> 0] | 0;
          break;
        }
      else {
        i = (b[d >> 0] & 3) ^ 1;
        b[g >> 0] = i;
        j = (b[(d + 1) >> 0] & 3) ^ 1;
        b[(g + 1) >> 0] = j;
        h = (b[(d + 2) >> 0] & 3) ^ 1;
        b[(g + 2) >> 0] = h;
        G = (b[(d + 3) >> 0] & 3) ^ 1;
        b[(g + 3) >> 0] = G;
        H = (b[(d + 4) >> 0] & 3) ^ 1;
        b[(g + 4) >> 0] = H;
        I = (b[(d + 5) >> 0] & 3) ^ 1;
        b[(g + 5) >> 0] = I;
        J = (b[(d + 6) >> 0] & 3) ^ 1;
        b[(g + 6) >> 0] = J;
        K = (b[(d + 7) >> 0] & 3) ^ 1;
        b[(g + 7) >> 0] = K;
        L = (b[(d + 8) >> 0] & 3) ^ 1;
        b[(g + 8) >> 0] = L;
        M = (b[(d + 9) >> 0] & 3) ^ 1;
        b[(g + 9) >> 0] = M;
        N = (b[(d + 10) >> 0] & 3) ^ 1;
        b[(g + 10) >> 0] = N;
        O = (b[(d + 11) >> 0] & 3) ^ 1;
        b[(g + 11) >> 0] = O;
        P = (b[(d + 12) >> 0] & 3) ^ 1;
        b[(g + 12) >> 0] = P;
        Q = (b[(d + 13) >> 0] & 3) ^ 1;
        b[(g + 13) >> 0] = Q;
        R = (b[(d + 14) >> 0] & 3) ^ 1;
        b[(g + 14) >> 0] = R;
        S = (b[(d + 15) >> 0] & 3) ^ 1;
        b[(g + 15) >> 0] = S;
        m = a;
        o = c;
        p = i;
        q = j;
        r = h;
        s = G;
        t = H;
        v = I;
        w = J;
        x = K;
        y = L;
        z = M;
        A = N;
        B = O;
        C = P;
        D = Q;
        E = R;
        F = S;
      }
    while (0);
    b[e >> 0] = o;
    b[(e + 1) >> 0] = o >>> 8;
    b[(e + 2) >> 0] = m;
    b[(e + 3) >> 0] = m >>> 8;
    b[(e + 4) >> 0] =
      ((q & 255) << 2) | (p & 255) | ((r & 255) << 4) | ((s & 255) << 6);
    b[(e + 5) >> 0] =
      ((v & 255) << 2) | (t & 255) | ((w & 255) << 4) | ((x & 255) << 6);
    b[(e + 6) >> 0] =
      ((z & 255) << 2) | (y & 255) | ((A & 255) << 4) | ((B & 255) << 6);
    b[(e + 7) >> 0] =
      ((D & 255) << 2) | (C & 255) | ((E & 255) << 4) | ((F & 255) << 6);
    u = f;
    return;
  }
  function $a(a, c, d) {
    a = a | 0;
    c = c | 0;
    d = d | 0;
    var e = 0,
      f = 0,
      g = 0,
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
      v = 0,
      w = 0,
      x = 0;
    e = u;
    u = (u + 32) | 0;
    f = (e + 16) | 0;
    g = e;
    i = b[(c + 1) >> 0] | 0;
    j = h[c >> 0] | 0;
    k = i & 255;
    l = (k << 8) | j;
    m = (i & 255) >>> 3;
    i = ((m << 3) & 255) | ((m & 255) >>> 2);
    b[f >> 0] = i;
    m = ((l >>> 5) << 2) | ((k >>> 1) & 3);
    b[(f + 1) >> 0] = m;
    k = ((j >>> 2) & 7) | (j << 3);
    b[(f + 2) >> 0] = k;
    b[(f + 3) >> 0] = -1;
    j = b[(c + 3) >> 0] | 0;
    n = h[(c + 2) >> 0] | 0;
    o = j & 255;
    p = (o << 8) | n;
    q = (j & 255) >>> 3;
    j = ((q << 3) & 255) | ((q & 255) >>> 2);
    b[(f + 4) >> 0] = j;
    q = ((p >>> 5) << 2) | ((o >>> 1) & 3);
    b[(f + 5) >> 0] = q;
    o = ((n >>> 2) & 7) | (n << 3);
    b[(f + 6) >> 0] = o;
    b[(f + 7) >> 0] = -1;
    n = (l >>> 0 > p >>> 0) | (d ^ 1);
    if (n) {
      b[(f + 8) >> 0] = (((((i << 1) + j) | 0) >>> 0) / 3) | 0;
      b[(f + 12) >> 0] = (((((j << 1) + i) | 0) >>> 0) / 3) | 0;
      d = m & 255;
      p = q & 255;
      b[(f + 9) >> 0] = (((((d << 1) + p) | 0) >>> 0) / 3) | 0;
      b[(f + 13) >> 0] = (((((p << 1) + d) | 0) >>> 0) / 3) | 0;
      d = k & 255;
      p = o & 255;
      b[(f + 10) >> 0] = (((((d << 1) + p) | 0) >>> 0) / 3) | 0;
      r = ((((((p << 1) + d) | 0) >>> 0) / 3) | 0) & 255;
    } else {
      b[(f + 8) >> 0] = ((j + i) | 0) >>> 1;
      b[(f + 12) >> 0] = 0;
      b[(f + 9) >> 0] = (((q & 255) + (m & 255)) | 0) >>> 1;
      b[(f + 13) >> 0] = 0;
      b[(f + 10) >> 0] = (((o & 255) + (k & 255)) | 0) >>> 1;
      r = 0;
    }
    b[(f + 14) >> 0] = r;
    b[(f + 11) >> 0] = -1;
    b[(f + 15) >> 0] = (n << 31) >> 31;
    n = b[(c + 4) >> 0] | 0;
    r = n & 255;
    k = r & 3;
    b[g >> 0] = k;
    o = (r >>> 2) & 3;
    b[(g + 1) >> 0] = o;
    m = (r >>> 4) & 3;
    b[(g + 2) >> 0] = m;
    r = (n & 255) >>> 6;
    b[(g + 3) >> 0] = r;
    n = b[(c + 5) >> 0] | 0;
    q = n & 255;
    i = q & 3;
    b[(g + 4) >> 0] = i;
    j = (q >>> 2) & 3;
    b[(g + 5) >> 0] = j;
    d = (q >>> 4) & 3;
    b[(g + 6) >> 0] = d;
    q = (n & 255) >>> 6;
    b[(g + 7) >> 0] = q;
    n = b[(c + 6) >> 0] | 0;
    p = n & 255;
    l = p & 3;
    b[(g + 8) >> 0] = l;
    s = (p >>> 2) & 3;
    b[(g + 9) >> 0] = s;
    t = (p >>> 4) & 3;
    b[(g + 10) >> 0] = t;
    p = (n & 255) >>> 6;
    b[(g + 11) >> 0] = p;
    n = b[(c + 7) >> 0] | 0;
    c = n & 255;
    v = c & 3;
    b[(g + 12) >> 0] = v;
    w = (c >>> 2) & 3;
    b[(g + 13) >> 0] = w;
    x = (c >>> 4) & 3;
    b[(g + 14) >> 0] = x;
    b[(g + 15) >> 0] = (n & 255) >>> 6;
    n = (f + (k << 2)) | 0;
    k =
      h[n >> 0] |
      (h[(n + 1) >> 0] << 8) |
      (h[(n + 2) >> 0] << 16) |
      (h[(n + 3) >> 0] << 24);
    b[a >> 0] = k;
    b[(a + 1) >> 0] = k >> 8;
    b[(a + 2) >> 0] = k >> 16;
    b[(a + 3) >> 0] = k >> 24;
    k = (a + 4) | 0;
    n = (f + (o << 2)) | 0;
    o =
      h[n >> 0] |
      (h[(n + 1) >> 0] << 8) |
      (h[(n + 2) >> 0] << 16) |
      (h[(n + 3) >> 0] << 24);
    b[k >> 0] = o;
    b[(k + 1) >> 0] = o >> 8;
    b[(k + 2) >> 0] = o >> 16;
    b[(k + 3) >> 0] = o >> 24;
    o = (a + 8) | 0;
    k = (f + (m << 2)) | 0;
    m =
      h[k >> 0] |
      (h[(k + 1) >> 0] << 8) |
      (h[(k + 2) >> 0] << 16) |
      (h[(k + 3) >> 0] << 24);
    b[o >> 0] = m;
    b[(o + 1) >> 0] = m >> 8;
    b[(o + 2) >> 0] = m >> 16;
    b[(o + 3) >> 0] = m >> 24;
    m = (a + 12) | 0;
    o = (f + ((r << 2) & 255)) | 0;
    r =
      h[o >> 0] |
      (h[(o + 1) >> 0] << 8) |
      (h[(o + 2) >> 0] << 16) |
      (h[(o + 3) >> 0] << 24);
    b[m >> 0] = r;
    b[(m + 1) >> 0] = r >> 8;
    b[(m + 2) >> 0] = r >> 16;
    b[(m + 3) >> 0] = r >> 24;
    r = (a + 16) | 0;
    m = (f + (i << 2)) | 0;
    i =
      h[m >> 0] |
      (h[(m + 1) >> 0] << 8) |
      (h[(m + 2) >> 0] << 16) |
      (h[(m + 3) >> 0] << 24);
    b[r >> 0] = i;
    b[(r + 1) >> 0] = i >> 8;
    b[(r + 2) >> 0] = i >> 16;
    b[(r + 3) >> 0] = i >> 24;
    i = (a + 20) | 0;
    r = (f + (j << 2)) | 0;
    j =
      h[r >> 0] |
      (h[(r + 1) >> 0] << 8) |
      (h[(r + 2) >> 0] << 16) |
      (h[(r + 3) >> 0] << 24);
    b[i >> 0] = j;
    b[(i + 1) >> 0] = j >> 8;
    b[(i + 2) >> 0] = j >> 16;
    b[(i + 3) >> 0] = j >> 24;
    j = (a + 24) | 0;
    i = (f + (d << 2)) | 0;
    d =
      h[i >> 0] |
      (h[(i + 1) >> 0] << 8) |
      (h[(i + 2) >> 0] << 16) |
      (h[(i + 3) >> 0] << 24);
    b[j >> 0] = d;
    b[(j + 1) >> 0] = d >> 8;
    b[(j + 2) >> 0] = d >> 16;
    b[(j + 3) >> 0] = d >> 24;
    d = (a + 28) | 0;
    j = (f + ((q << 2) & 255)) | 0;
    q =
      h[j >> 0] |
      (h[(j + 1) >> 0] << 8) |
      (h[(j + 2) >> 0] << 16) |
      (h[(j + 3) >> 0] << 24);
    b[d >> 0] = q;
    b[(d + 1) >> 0] = q >> 8;
    b[(d + 2) >> 0] = q >> 16;
    b[(d + 3) >> 0] = q >> 24;
    q = (a + 32) | 0;
    d = (f + (l << 2)) | 0;
    l =
      h[d >> 0] |
      (h[(d + 1) >> 0] << 8) |
      (h[(d + 2) >> 0] << 16) |
      (h[(d + 3) >> 0] << 24);
    b[q >> 0] = l;
    b[(q + 1) >> 0] = l >> 8;
    b[(q + 2) >> 0] = l >> 16;
    b[(q + 3) >> 0] = l >> 24;
    l = (a + 36) | 0;
    q = (f + (s << 2)) | 0;
    s =
      h[q >> 0] |
      (h[(q + 1) >> 0] << 8) |
      (h[(q + 2) >> 0] << 16) |
      (h[(q + 3) >> 0] << 24);
    b[l >> 0] = s;
    b[(l + 1) >> 0] = s >> 8;
    b[(l + 2) >> 0] = s >> 16;
    b[(l + 3) >> 0] = s >> 24;
    s = (a + 40) | 0;
    l = (f + (t << 2)) | 0;
    t =
      h[l >> 0] |
      (h[(l + 1) >> 0] << 8) |
      (h[(l + 2) >> 0] << 16) |
      (h[(l + 3) >> 0] << 24);
    b[s >> 0] = t;
    b[(s + 1) >> 0] = t >> 8;
    b[(s + 2) >> 0] = t >> 16;
    b[(s + 3) >> 0] = t >> 24;
    t = (a + 44) | 0;
    s = (f + ((p << 2) & 255)) | 0;
    p =
      h[s >> 0] |
      (h[(s + 1) >> 0] << 8) |
      (h[(s + 2) >> 0] << 16) |
      (h[(s + 3) >> 0] << 24);
    b[t >> 0] = p;
    b[(t + 1) >> 0] = p >> 8;
    b[(t + 2) >> 0] = p >> 16;
    b[(t + 3) >> 0] = p >> 24;
    p = (a + 48) | 0;
    t = (f + (v << 2)) | 0;
    v =
      h[t >> 0] |
      (h[(t + 1) >> 0] << 8) |
      (h[(t + 2) >> 0] << 16) |
      (h[(t + 3) >> 0] << 24);
    b[p >> 0] = v;
    b[(p + 1) >> 0] = v >> 8;
    b[(p + 2) >> 0] = v >> 16;
    b[(p + 3) >> 0] = v >> 24;
    v = (a + 52) | 0;
    p = (f + (w << 2)) | 0;
    w =
      h[p >> 0] |
      (h[(p + 1) >> 0] << 8) |
      (h[(p + 2) >> 0] << 16) |
      (h[(p + 3) >> 0] << 24);
    b[v >> 0] = w;
    b[(v + 1) >> 0] = w >> 8;
    b[(v + 2) >> 0] = w >> 16;
    b[(v + 3) >> 0] = w >> 24;
    w = (a + 56) | 0;
    v = (f + (x << 2)) | 0;
    x =
      h[v >> 0] |
      (h[(v + 1) >> 0] << 8) |
      (h[(v + 2) >> 0] << 16) |
      (h[(v + 3) >> 0] << 24);
    b[w >> 0] = x;
    b[(w + 1) >> 0] = x >> 8;
    b[(w + 2) >> 0] = x >> 16;
    b[(w + 3) >> 0] = x >> 24;
    x = (a + 60) | 0;
    a = (f + (((h[(g + 15) >> 0] | 0) << 2) & 252)) | 0;
    g =
      h[a >> 0] |
      (h[(a + 1) >> 0] << 8) |
      (h[(a + 2) >> 0] << 16) |
      (h[(a + 3) >> 0] << 24);
    b[x >> 0] = g;
    b[(x + 1) >> 0] = g >> 8;
    b[(x + 2) >> 0] = g >> 16;
    b[(x + 3) >> 0] = g >> 24;
    u = e;
    return;
  }
  function ab(a, b, c) {
    a = a | 0;
    b = b | 0;
    c = c | 0;
    f[a >> 2] = 144;
    f[(a + 4) >> 2] = b;
    f[(a + 8) >> 2] = c;
    return;
  }
  function bb(a, c) {
    a = a | 0;
    c = c | 0;
    var d = 0;
    d = f[a >> 2] | 0;
    if (!(f[(a + 8) >> 2] & 1)) {
      Ea[f[(d + 4) >> 2] & 7](a, c);
      return;
    }
    Ea[f[d >> 2] & 7](a, c);
    if (b[((f[(a + 4) >> 2] | 0) + 324) >> 0] | 0) return;
    Ea[f[((f[a >> 2] | 0) + 4) >> 2] & 7](a, c);
    return;
  }
  function cb(a, c, d, e) {
    a = a | 0;
    c = c | 0;
    d = d | 0;
    e = e | 0;
    var g = 0,
      i = 0,
      j = 0,
      k = 0,
      l = 0,
      m = 0,
      o = 0,
      p = 0,
      q = 0,
      r = 0,
      s = 0,
      t = 0.0,
      u = 0.0,
      v = 0.0,
      w = 0;
    f[a >> 2] = 0;
    g = (a + 324) | 0;
    b[g >> 0] = 0;
    i = ((e & 1) | 0) != 0;
    j = ((e & 128) | 0) != 0;
    e = 0;
    do {
      a: do
        if (!((1 << e) & d)) f[(a + 260 + (e << 2)) >> 2] = -1;
        else {
          if (i ? (b[(c + ((e << 2) | 3)) >> 0] | 0) > -1 : 0) {
            f[(a + 260 + (e << 2)) >> 2] = -1;
            b[g >> 0] = 1;
            break;
          }
          k = e << 2;
          l = (c + k) | 0;
          m = (c + (k | 1)) | 0;
          o = (c + (k | 2)) | 0;
          b: do
            if (!e) p = 0;
            else {
              c: do
                if (i) {
                  q = 0;
                  while (1) {
                    if (
                      (
                        (
                          (
                            ((1 << q) & d) | 0
                              ? ((r = q << 2),
                                (b[l >> 0] | 0) == (b[(c + r) >> 0] | 0))
                              : 0
                          )
                            ? (b[m >> 0] | 0) == (b[(c + (r | 1)) >> 0] | 0)
                            : 0
                        )
                          ? (b[o >> 0] | 0) == (b[(c + (r | 2)) >> 0] | 0)
                          : 0
                      )
                        ? (b[(c + (r | 3)) >> 0] | 0) < 0
                        : 0
                    ) {
                      s = q;
                      break c;
                    }
                    q = (q + 1) | 0;
                    if ((q | 0) == (e | 0)) {
                      p = k;
                      break b;
                    }
                  }
                } else {
                  q = 0;
                  while (1) {
                    if (
                      (
                        (
                          ((1 << q) & d) | 0
                            ? ((r = q << 2),
                              (b[l >> 0] | 0) == (b[(c + r) >> 0] | 0))
                            : 0
                        )
                          ? (b[m >> 0] | 0) == (b[(c + (r | 1)) >> 0] | 0)
                          : 0
                      )
                        ? (b[o >> 0] | 0) == (b[(c + (r | 2)) >> 0] | 0)
                        : 0
                    ) {
                      s = q;
                      break c;
                    }
                    q = (q + 1) | 0;
                    if ((q | 0) == (e | 0)) {
                      p = k;
                      break b;
                    }
                  }
                }
              while (0);
              q = f[(a + 260 + (s << 2)) >> 2] | 0;
              r = (a + 196 + (q << 2)) | 0;
              n[r >> 2] =
                +n[r >> 2] +
                (j
                  ? +(((h[(c + (k | 3)) >> 0] | 0) + 1) | 0) * 0.00390625
                  : 1.0);
              f[(a + 260 + (e << 2)) >> 2] = q;
              break a;
            }
          while (0);
          t = +(h[m >> 0] | 0) / 255.0;
          u = +(h[o >> 0] | 0) / 255.0;
          v = +(((h[(c + (p | 3)) >> 0] | 0) + 1) | 0) * 0.00390625;
          k = f[a >> 2] | 0;
          n[(a + 4 + ((k * 12) | 0)) >> 2] = +(h[l >> 0] | 0) / 255.0;
          n[(a + 4 + ((k * 12) | 0) + 4) >> 2] = t;
          n[(a + 4 + ((k * 12) | 0) + 8) >> 2] = u;
          n[(a + 196 + (f[a >> 2] << 2)) >> 2] = j ? v : 1.0;
          f[(a + 260 + (e << 2)) >> 2] = f[a >> 2];
          f[a >> 2] = (f[a >> 2] | 0) + 1;
        }
      while (0);
      e = (e + 1) | 0;
    } while ((e | 0) != 16);
    if ((f[a >> 2] | 0) > 0) w = 0;
    else return;
    do {
      e = (a + 196 + (w << 2)) | 0;
      v = +K(+(+n[e >> 2]));
      n[e >> 2] = v;
      w = (w + 1) | 0;
    } while ((w | 0) < (f[a >> 2] | 0));
    return;
  }
  function db(a, c, d) {
    a = a | 0;
    c = c | 0;
    d = d | 0;
    var e = 0,
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
    e = f[(a + 260) >> 2] | 0;
    if ((e | 0) == -1) g = 3;
    else g = b[(c + e) >> 0] | 0;
    b[d >> 0] = g;
    g = f[(a + 264) >> 2] | 0;
    if ((g | 0) == -1) h = 3;
    else h = b[(c + g) >> 0] | 0;
    b[(d + 1) >> 0] = h;
    h = f[(a + 268) >> 2] | 0;
    if ((h | 0) == -1) i = 3;
    else i = b[(c + h) >> 0] | 0;
    b[(d + 2) >> 0] = i;
    i = f[(a + 272) >> 2] | 0;
    if ((i | 0) == -1) j = 3;
    else j = b[(c + i) >> 0] | 0;
    b[(d + 3) >> 0] = j;
    j = f[(a + 276) >> 2] | 0;
    if ((j | 0) == -1) k = 3;
    else k = b[(c + j) >> 0] | 0;
    b[(d + 4) >> 0] = k;
    k = f[(a + 280) >> 2] | 0;
    if ((k | 0) == -1) l = 3;
    else l = b[(c + k) >> 0] | 0;
    b[(d + 5) >> 0] = l;
    l = f[(a + 284) >> 2] | 0;
    if ((l | 0) == -1) m = 3;
    else m = b[(c + l) >> 0] | 0;
    b[(d + 6) >> 0] = m;
    m = f[(a + 288) >> 2] | 0;
    if ((m | 0) == -1) n = 3;
    else n = b[(c + m) >> 0] | 0;
    b[(d + 7) >> 0] = n;
    n = f[(a + 292) >> 2] | 0;
    if ((n | 0) == -1) o = 3;
    else o = b[(c + n) >> 0] | 0;
    b[(d + 8) >> 0] = o;
    o = f[(a + 296) >> 2] | 0;
    if ((o | 0) == -1) p = 3;
    else p = b[(c + o) >> 0] | 0;
    b[(d + 9) >> 0] = p;
    p = f[(a + 300) >> 2] | 0;
    if ((p | 0) == -1) q = 3;
    else q = b[(c + p) >> 0] | 0;
    b[(d + 10) >> 0] = q;
    q = f[(a + 304) >> 2] | 0;
    if ((q | 0) == -1) r = 3;
    else r = b[(c + q) >> 0] | 0;
    b[(d + 11) >> 0] = r;
    r = f[(a + 308) >> 2] | 0;
    if ((r | 0) == -1) s = 3;
    else s = b[(c + r) >> 0] | 0;
    b[(d + 12) >> 0] = s;
    s = f[(a + 312) >> 2] | 0;
    if ((s | 0) == -1) t = 3;
    else t = b[(c + s) >> 0] | 0;
    b[(d + 13) >> 0] = t;
    t = f[(a + 316) >> 2] | 0;
    if ((t | 0) == -1) u = 3;
    else u = b[(c + t) >> 0] | 0;
    b[(d + 14) >> 0] = u;
    u = f[(a + 320) >> 2] | 0;
    if ((u | 0) == -1) {
      v = 3;
      w = (d + 15) | 0;
      b[w >> 0] = v;
      return;
    }
    v = b[(c + u) >> 0] | 0;
    w = (d + 15) | 0;
    b[w >> 0] = v;
    return;
  }
  function eb(a, b, c, d) {
    a = a | 0;
    b = b | 0;
    c = c | 0;
    d = d | 0;
    var e = 0,
      g = 0,
      h = 0.0,
      i = 0.0,
      j = 0.0,
      k = 0.0,
      l = 0.0,
      m = 0.0,
      o = 0.0,
      p = 0.0,
      q = 0.0,
      r = 0.0,
      s = 0.0,
      t = 0.0,
      u = 0.0,
      v = 0,
      w = 0,
      x = 0,
      y = 0,
      z = 0,
      A = 0.0,
      B = 0.0,
      C = 0.0,
      D = 0.0,
      E = 0.0,
      F = 0.0;
    e = (b | 0) > 0;
    if (e) {
      g = 0;
      h = 0.0;
      i = 0.0;
      j = 0.0;
      k = 0.0;
      while (1) {
        l = +n[(d + (g << 2)) >> 2];
        m = h + l;
        o = i + l * +n[(c + ((g * 12) | 0)) >> 2];
        p = k + l * +n[(c + ((g * 12) | 0) + 4) >> 2];
        q = j + l * +n[(c + ((g * 12) | 0) + 8) >> 2];
        g = (g + 1) | 0;
        if ((g | 0) == (b | 0)) {
          r = m;
          s = o;
          t = q;
          u = p;
          break;
        } else {
          h = m;
          i = o;
          j = q;
          k = p;
        }
      }
    } else {
      r = 0.0;
      s = 0.0;
      t = 0.0;
      u = 0.0;
    }
    k = 1.0 / r;
    r = s * k;
    s = u * k;
    u = t * k;
    g = (a + 4) | 0;
    v = (a + 8) | 0;
    w = (a + 12) | 0;
    x = (a + 16) | 0;
    y = (a + 20) | 0;
    f[a >> 2] = 0;
    f[(a + 4) >> 2] = 0;
    f[(a + 8) >> 2] = 0;
    f[(a + 12) >> 2] = 0;
    f[(a + 16) >> 2] = 0;
    f[(a + 20) >> 2] = 0;
    if (e) {
      z = 0;
      A = 0.0;
      B = 0.0;
      C = 0.0;
      D = 0.0;
      E = 0.0;
      F = 0.0;
    } else return;
    do {
      k = +n[(c + ((z * 12) | 0)) >> 2] - r;
      t = +n[(c + ((z * 12) | 0) + 4) >> 2] - s;
      j = +n[(c + ((z * 12) | 0) + 8) >> 2] - u;
      i = +n[(d + (z << 2)) >> 2];
      h = t * i;
      p = j * i;
      A = A + k * (k * i);
      B = k * h + B;
      C = k * p + C;
      D = t * h + D;
      E = t * p + E;
      F = j * p + F;
      z = (z + 1) | 0;
    } while ((z | 0) != (b | 0));
    n[a >> 2] = A;
    n[g >> 2] = B;
    n[v >> 2] = C;
    n[w >> 2] = D;
    n[x >> 2] = E;
    n[y >> 2] = F;
    return;
  }
  function fb(a, b) {
    a = a | 0;
    b = b | 0;
    var c = 0.0,
      d = 0.0,
      e = 0.0,
      f = 0.0,
      g = 0.0,
      h = 0.0,
      i = 0.0,
      j = 0.0,
      k = 0.0,
      l = 0.0,
      m = 0.0,
      o = 0.0,
      p = 0.0,
      q = 0.0,
      r = 0,
      s = 0.0,
      t = 0,
      u = 0,
      v = 0,
      w = 0.0,
      x = 0.0,
      y = 0.0;
    c = +n[b >> 2];
    d = +n[(b + 12) >> 2];
    e = c * d;
    f = +n[(b + 20) >> 2];
    g = +n[(b + 4) >> 2];
    h = +n[(b + 8) >> 2];
    i = +n[(b + 16) >> 2];
    j = d * f + (e + c * f) - g * g - h * h - i * i;
    k = c + d + f;
    l = k * 0.3333333432674408;
    m = j - k * l;
    o =
      k * (k * (k * -0.07407407462596893)) +
      k * (j * 0.3333333432674408) -
      (e * f + g * 2.0 * h * i - i * (c * i) - h * (d * h) - g * (f * g));
    e = o * (o * 0.25);
    j = m * (m * (m * 0.03703703731298447)) + e;
    if (j > 1.1920928955078125e-7) {
      n[a >> 2] = 1.0;
      n[(a + 4) >> 2] = 1.0;
      n[(a + 8) >> 2] = 1.0;
      return;
    }
    if (j < -1.1920928955078125e-7) {
      m = +L(+(+K(+(e - j))), 0.3333333432674408);
      e = +S(+(+K(+-j)), +(o * -0.5)) / 3.0;
      j = +M(+e);
      k = l + m * 2.0 * j;
      p = +N(+e) * 1.7320507764816284;
      e = l - m * (j + p);
      q = l - m * (j - p);
      r = +J(+e) > +J(+k);
      p = r ? e : k;
      r = +J(+q) > +J(+p);
      gb(a, b, r ? q : p);
      return;
    }
    if (o < 0.0) s = -+L(+(o * -0.5), 0.3333333432674408);
    else s = +L(+(o * 0.5), 0.3333333432674408);
    o = l + s;
    p = l - s * 2.0;
    if (!(+J(+o) > +J(+p))) {
      gb(a, b, p);
      return;
    }
    p = c - o;
    c = d - o;
    d = f - o;
    o = +J(+p);
    f = +J(+g);
    b = f > o;
    s = b ? f : o;
    o = +J(+h);
    r = o > s;
    f = r ? o : s;
    s = +J(+c);
    t = s > f;
    o = t ? s : f;
    f = +J(+i);
    u = f > o;
    v = +J(+d) > (u ? f : o);
    switch ((v ? 5 : u ? 4 : t ? 3 : r ? 2 : b & 1) & 7) {
      case 1:
      case 0: {
        w = 0.0;
        x = p;
        y = -g;
        break;
      }
      case 2: {
        w = -p;
        x = 0.0;
        y = h;
        break;
      }
      case 4:
      case 3: {
        w = c;
        x = -i;
        y = 0.0;
        break;
      }
      default: {
        w = i;
        x = -d;
        y = 0.0;
      }
    }
    n[a >> 2] = y;
    n[(a + 4) >> 2] = x;
    n[(a + 8) >> 2] = w;
    return;
  }
  function gb(a, b, c) {
    a = a | 0;
    b = b | 0;
    c = +c;
    var d = 0,
      e = 0,
      g = 0.0,
      h = 0.0,
      i = 0.0,
      j = 0.0,
      k = 0.0,
      l = 0.0,
      m = 0.0,
      o = 0.0,
      p = 0,
      q = 0.0,
      r = 0,
      s = 0,
      t = 0,
      v = 0,
      w = 0,
      x = 0,
      y = 0,
      z = 0,
      A = 0,
      B = 0,
      C = 0;
    d = u;
    u = (u + 32) | 0;
    e = d;
    g = +n[b >> 2] - c;
    h = +n[(b + 4) >> 2];
    i = +n[(b + 8) >> 2];
    j = +n[(b + 12) >> 2] - c;
    k = +n[(b + 16) >> 2];
    l = +n[(b + 20) >> 2] - c;
    c = j * l - k * k;
    n[e >> 2] = c;
    m = i * k - h * l;
    b = (e + 4) | 0;
    n[b >> 2] = m;
    o = h * k - i * j;
    p = (e + 8) | 0;
    n[p >> 2] = o;
    q = g * l - i * i;
    r = (e + 12) | 0;
    n[r >> 2] = q;
    l = h * i - g * k;
    s = (e + 16) | 0;
    n[s >> 2] = l;
    k = g * j - h * h;
    t = (e + 20) | 0;
    n[t >> 2] = k;
    h = +J(+c);
    c = +J(+m);
    v = c > h;
    m = v ? c : h;
    h = +J(+o);
    w = h > m;
    o = w ? h : m;
    m = +J(+q);
    x = m > o;
    q = x ? m : o;
    o = +J(+l);
    y = o > q;
    z = +J(+k) > (y ? o : q);
    switch ((z ? 5 : y ? 4 : x ? 3 : w ? 2 : v & 1) & 7) {
      case 0: {
        A = b;
        B = p;
        C = e;
        break;
      }
      case 3:
      case 1: {
        A = r;
        B = s;
        C = b;
        break;
      }
      default: {
        A = s;
        B = t;
        C = p;
      }
    }
    p = f[A >> 2] | 0;
    A = f[B >> 2] | 0;
    f[a >> 2] = f[C >> 2];
    f[(a + 4) >> 2] = p;
    f[(a + 8) >> 2] = A;
    u = d;
    return;
  }
  function hb(a, c) {
    a = a | 0;
    c = c | 0;
    var d = 0,
      e = 0,
      g = 0,
      h = 0,
      i = 0,
      j = 0,
      k = 0,
      l = 0,
      m = 0,
      o = 0.0,
      p = 0.0,
      q = 0.0,
      r = 0.0,
      s = 0.0,
      t = 0.0,
      v = 0.0,
      w = 0.0,
      x = 0.0,
      y = 0.0,
      z = 0.0,
      A = 0.0,
      B = 0.0,
      C = 0.0,
      D = 0.0,
      E = 0.0,
      F = 0.0,
      G = 0.0,
      H = 0.0,
      I = 0.0,
      J = 0.0,
      K = 0,
      L = 0.0;
    d = u;
    u = (u + 80) | 0;
    e = d;
    g = (d + 56) | 0;
    h = (d + 40) | 0;
    i = f[(a + 4) >> 2] | 0;
    j = f[i >> 2] | 0;
    k = (a + 24) | 0;
    f[e >> 2] = f[k >> 2];
    f[(e + 4) >> 2] = f[(k + 4) >> 2];
    f[(e + 8) >> 2] = f[(k + 8) >> 2];
    l = (a + 36) | 0;
    m = (e + 12) | 0;
    f[m >> 2] = f[l >> 2];
    f[(m + 4) >> 2] = f[(l + 4) >> 2];
    f[(m + 8) >> 2] = f[(l + 8) >> 2];
    o = +n[k >> 2] * 0.5 + +n[l >> 2] * 0.5;
    p = +n[(a + 28) >> 2] * 0.5 + +n[(a + 40) >> 2] * 0.5;
    q = +n[(a + 32) >> 2] * 0.5 + +n[(a + 44) >> 2] * 0.5;
    n[(e + 24) >> 2] = o;
    n[(e + 28) >> 2] = p;
    n[(e + 32) >> 2] = q;
    if ((j | 0) > 0) {
      r = +n[(a + 12) >> 2];
      s = +n[(a + 16) >> 2];
      t = +n[(a + 20) >> 2];
      v = +n[e >> 2];
      w = +n[(e + 4) >> 2];
      x = +n[(e + 8) >> 2];
      y = +n[(e + 12) >> 2];
      z = +n[(e + 16) >> 2];
      A = +n[(e + 20) >> 2];
      B = 0.0;
      e = 0;
      while (1) {
        C = +n[(i + 4 + ((e * 12) | 0)) >> 2];
        D = +n[(i + 4 + ((e * 12) | 0) + 4) >> 2];
        E = +n[(i + 4 + ((e * 12) | 0) + 8) >> 2];
        F = (C - v) * r;
        G = (D - w) * s;
        H = (E - x) * t;
        I = F * F + G * G + H * H;
        H =
          I < 3402823466385288598117041.0e14
            ? I
            : 3402823466385288598117041.0e14;
        I = (C - y) * r;
        G = (D - z) * s;
        F = (E - A) * t;
        J = I * I + G * G + F * F;
        m = J < H;
        F = m ? J : H;
        H = (C - o) * r;
        C = (D - p) * s;
        D = (E - q) * t;
        E = H * H + C * C + D * D;
        K = E < F;
        b[(g + e) >> 0] = K ? 2 : m & 1;
        D = B + (K ? E : F);
        e = (e + 1) | 0;
        if ((e | 0) == (j | 0)) {
          L = D;
          break;
        } else B = D;
      }
    } else L = 0.0;
    j = (a + 48) | 0;
    if (!(L < +n[j >> 2])) {
      u = d;
      return;
    }
    db(i, g, h);
    Za(k, l, h, c);
    n[j >> 2] = L;
    u = d;
    return;
  }
  function ib(a, c) {
    a = a | 0;
    c = c | 0;
    var d = 0,
      e = 0,
      g = 0,
      h = 0,
      i = 0,
      j = 0,
      k = 0,
      l = 0,
      m = 0,
      o = 0.0,
      p = 0.0,
      q = 0.0,
      r = 0.0,
      s = 0.0,
      t = 0.0,
      v = 0.0,
      w = 0.0,
      x = 0.0,
      y = 0.0,
      z = 0.0,
      A = 0.0,
      B = 0.0,
      C = 0.0,
      D = 0.0,
      E = 0.0,
      F = 0.0,
      G = 0.0,
      H = 0.0,
      I = 0.0,
      J = 0.0,
      K = 0.0,
      L = 0.0,
      M = 0.0,
      N = 0,
      O = 0,
      P = 0.0;
    d = u;
    u = (u + 80) | 0;
    e = d;
    g = (d + 64) | 0;
    h = (d + 48) | 0;
    i = f[(a + 4) >> 2] | 0;
    j = f[i >> 2] | 0;
    k = (a + 24) | 0;
    f[e >> 2] = f[k >> 2];
    f[(e + 4) >> 2] = f[(k + 4) >> 2];
    f[(e + 8) >> 2] = f[(k + 8) >> 2];
    l = (a + 36) | 0;
    m = (e + 12) | 0;
    f[m >> 2] = f[l >> 2];
    f[(m + 4) >> 2] = f[(l + 4) >> 2];
    f[(m + 8) >> 2] = f[(l + 8) >> 2];
    o = +n[k >> 2];
    p = +n[(a + 28) >> 2];
    q = +n[(a + 32) >> 2];
    r = +n[l >> 2];
    s = +n[(a + 40) >> 2];
    t = +n[(a + 44) >> 2];
    v = o * 0.6666666865348816 + r * 0.3333333432674408;
    w = p * 0.6666666865348816 + s * 0.3333333432674408;
    x = q * 0.6666666865348816 + t * 0.3333333432674408;
    n[(e + 24) >> 2] = v;
    n[(e + 28) >> 2] = w;
    n[(e + 32) >> 2] = x;
    y = o * 0.3333333432674408 + r * 0.6666666865348816;
    r = p * 0.3333333432674408 + s * 0.6666666865348816;
    s = q * 0.3333333432674408 + t * 0.6666666865348816;
    n[(e + 36) >> 2] = y;
    n[(e + 40) >> 2] = r;
    n[(e + 44) >> 2] = s;
    if ((j | 0) > 0) {
      t = +n[(a + 12) >> 2];
      q = +n[(a + 16) >> 2];
      p = +n[(a + 20) >> 2];
      o = +n[e >> 2];
      z = +n[(e + 4) >> 2];
      A = +n[(e + 8) >> 2];
      B = +n[(e + 12) >> 2];
      C = +n[(e + 16) >> 2];
      D = +n[(e + 20) >> 2];
      E = 0.0;
      e = 0;
      while (1) {
        F = +n[(i + 4 + ((e * 12) | 0)) >> 2];
        G = +n[(i + 4 + ((e * 12) | 0) + 4) >> 2];
        H = +n[(i + 4 + ((e * 12) | 0) + 8) >> 2];
        I = (F - o) * t;
        J = (G - z) * q;
        K = (H - A) * p;
        L = I * I + J * J + K * K;
        K =
          L < 3402823466385288598117041.0e14
            ? L
            : 3402823466385288598117041.0e14;
        L = (F - B) * t;
        J = (G - C) * q;
        I = (H - D) * p;
        M = L * L + J * J + I * I;
        m = M < K;
        I = m ? M : K;
        K = (F - v) * t;
        M = (G - w) * q;
        J = (H - x) * p;
        L = K * K + M * M + J * J;
        N = L < I;
        J = N ? L : I;
        I = (F - y) * t;
        F = (G - r) * q;
        G = (H - s) * p;
        H = I * I + F * F + G * G;
        O = H < J;
        b[(g + e) >> 0] = O ? 3 : N ? 2 : m & 1;
        G = E + (O ? H : J);
        e = (e + 1) | 0;
        if ((e | 0) == (j | 0)) {
          P = G;
          break;
        } else E = G;
      }
    } else P = 0.0;
    j = (a + 48) | 0;
    if (!(P < +n[j >> 2])) {
      u = d;
      return;
    }
    db(i, g, h);
    _a(k, l, h, c);
    n[j >> 2] = P;
    u = d;
    return;
  }
  function jb(a, b, c) {
    a = a | 0;
    b = b | 0;
    c = c | 0;
    var d = 0,
      e = 0,
      g = 0,
      h = 0,
      i = 0,
      j = 0.0,
      k = 0.0,
      l = 0.0,
      m = 0.0,
      o = 0.0,
      p = 0.0,
      q = 0.0,
      r = 0.0,
      t = 0.0,
      v = 0.0,
      w = 0.0,
      x = 0.0,
      y = 0.0,
      z = 0,
      A = 0,
      B = 0,
      C = 0,
      D = 0.0,
      E = 0.0,
      F = 0,
      G = 0,
      H = 0.0,
      J = 0.0,
      K = 0,
      L = 0,
      M = 0,
      N = 0,
      O = 0,
      P = 0,
      Q = 0.0,
      R = 0.0,
      S = 0.0,
      T = 0.0,
      U = 0.0,
      W = 0.0,
      X = 0.0,
      Y = 0.0,
      Z = 0.0,
      _ = 0,
      $ = 0,
      aa = 0;
    d = u;
    u = (u + 48) | 0;
    e = (d + 16) | 0;
    g = d;
    ab(a, b, c);
    f[a >> 2] = 160;
    c = ((f[(a + 8) >> 2] & 32) | 0) == 0;
    n[(a + 12) >> 2] = c ? 1.0 : 0.2125999927520752;
    n[(a + 16) >> 2] = c ? 1.0 : 0.7152000069618225;
    n[(a + 20) >> 2] = c ? 1.0 : 0.0722000002861023;
    n[(a + 48) >> 2] = 3402823466385288598117041.0e14;
    c = f[(a + 4) >> 2] | 0;
    b = f[c >> 2] | 0;
    eb(e, b, (c + 4) | 0, (c + 196) | 0);
    fb(g, e);
    if ((b | 0) > 0) {
      e = f[(c + 4) >> 2] | 0;
      h = f[(c + 8) >> 2] | 0;
      i = f[(c + 12) >> 2] | 0;
      j = ((f[s >> 2] = e), +n[s >> 2]);
      k = +n[g >> 2];
      l = ((f[s >> 2] = h), +n[s >> 2]);
      m = +n[(g + 4) >> 2];
      o = ((f[s >> 2] = i), +n[s >> 2]);
      p = +n[(g + 8) >> 2];
      q = j * k + l * m + o * p;
      if ((b | 0) == 1) {
        r = j;
        t = j;
        v = l;
        w = o;
        x = o;
        y = l;
      } else {
        l = q;
        g = 1;
        o = q;
        z = e;
        A = e;
        e = h;
        B = i;
        C = i;
        i = h;
        while (1) {
          q = +n[(c + 4 + ((g * 12) | 0)) >> 2];
          j = +n[(c + 4 + ((g * 12) | 0) + 4) >> 2];
          D = +n[(c + 4 + ((g * 12) | 0) + 8) >> 2];
          E = q * k + j * m + D * p;
          h = ((n[s >> 2] = q), f[s >> 2] | 0);
          F = ((n[s >> 2] = j), f[s >> 2] | 0);
          G = ((n[s >> 2] = D), f[s >> 2] | 0);
          if (!(E < l))
            if (E > o) {
              H = l;
              J = E;
              K = h;
              L = A;
              M = F;
              N = G;
              O = C;
              P = i;
            } else {
              H = l;
              J = o;
              K = z;
              L = A;
              M = e;
              N = B;
              O = C;
              P = i;
            }
          else {
            H = E;
            J = o;
            K = z;
            L = h;
            M = e;
            N = B;
            O = G;
            P = F;
          }
          g = (g + 1) | 0;
          if ((g | 0) >= (b | 0)) break;
          else {
            l = H;
            o = J;
            z = K;
            A = L;
            e = M;
            B = N;
            C = O;
            i = P;
          }
        }
        J = ((f[s >> 2] = L), +n[s >> 2]);
        o = ((f[s >> 2] = P), +n[s >> 2]);
        H = ((f[s >> 2] = O), +n[s >> 2]);
        l = ((f[s >> 2] = K), +n[s >> 2]);
        p = ((f[s >> 2] = M), +n[s >> 2]);
        r = l;
        t = J;
        v = p;
        w = ((f[s >> 2] = N), +n[s >> 2]);
        x = H;
        y = o;
      }
    } else {
      r = 0.0;
      t = 0.0;
      v = 0.0;
      w = 0.0;
      x = 0.0;
      y = 0.0;
    }
    o = t > 0.0 ? t : 0.0;
    t = y > 0.0 ? y : 0.0;
    y = x > 0.0 ? x : 0.0;
    x = r > 0.0 ? r : 0.0;
    r = v > 0.0 ? v : 0.0;
    v = w > 0.0 ? w : 0.0;
    w = (o < 1.0 ? o : 1.0) * 31.0 + 0.5;
    o = (t < 1.0 ? t : 1.0) * 63.0 + 0.5;
    t = (y < 1.0 ? y : 1.0) * 31.0 + 0.5;
    if (w > 0.0) Q = +I(+w);
    else Q = +V(+w);
    if (o > 0.0) R = +I(+o);
    else R = +V(+o);
    if (t > 0.0) S = +I(+t);
    else S = +V(+t);
    n[(a + 24) >> 2] = Q * 0.032258063554763794;
    n[(a + 28) >> 2] = R * 0.01587301678955555;
    n[(a + 32) >> 2] = S * 0.032258063554763794;
    S = (x < 1.0 ? x : 1.0) * 31.0 + 0.5;
    x = (r < 1.0 ? r : 1.0) * 63.0 + 0.5;
    r = (v < 1.0 ? v : 1.0) * 31.0 + 0.5;
    if (S > 0.0) T = +I(+S);
    else T = +V(+S);
    if (x > 0.0) U = +I(+x);
    else U = +V(+x);
    if (r > 0.0) {
      W = +I(+r);
      X = T * 0.032258063554763794;
      Y = U * 0.01587301678955555;
      Z = W * 0.032258063554763794;
      _ = (a + 36) | 0;
      n[_ >> 2] = X;
      $ = (a + 40) | 0;
      n[$ >> 2] = Y;
      aa = (a + 44) | 0;
      n[aa >> 2] = Z;
      u = d;
      return;
    } else {
      W = +V(+r);
      X = T * 0.032258063554763794;
      Y = U * 0.01587301678955555;
      Z = W * 0.032258063554763794;
      _ = (a + 36) | 0;
      n[_ >> 2] = X;
      $ = (a + 40) | 0;
      n[$ >> 2] = Y;
      aa = (a + 44) | 0;
      n[aa >> 2] = Z;
      u = d;
      return;
    }
  }
  function kb(a, b) {
    a = a | 0;
    b = b | 0;
    var c = 0,
      d = 0,
      e = 0,
      g = 0;
    c = u;
    u = (u + 16) | 0;
    d = c;
    mb(a, 196);
    e = (a + 44) | 0;
    g = (a + 48) | 0;
    if ((f[e >> 2] | 0) >= (f[g >> 2] | 0)) {
      u = c;
      return;
    }
    db(f[(a + 4) >> 2] | 0, (a + 40) | 0, d);
    Za((a + 16) | 0, (a + 28) | 0, d, b);
    f[g >> 2] = f[e >> 2];
    u = c;
    return;
  }
  function lb(a, b) {
    a = a | 0;
    b = b | 0;
    var c = 0,
      d = 0,
      e = 0,
      g = 0;
    c = u;
    u = (u + 16) | 0;
    d = c;
    mb(a, 184);
    e = (a + 44) | 0;
    g = (a + 48) | 0;
    if ((f[e >> 2] | 0) >= (f[g >> 2] | 0)) {
      u = c;
      return;
    }
    db(f[(a + 4) >> 2] | 0, (a + 40) | 0, d);
    _a((a + 16) | 0, (a + 28) | 0, d, b);
    f[g >> 2] = f[e >> 2];
    u = c;
    return;
  }
  function mb(a, c) {
    a = a | 0;
    c = c | 0;
    var d = 0,
      e = 0,
      g = 0,
      i = 0,
      j = 0,
      k = 0,
      l = 0,
      m = 0,
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
      y = 0.0,
      z = 0.0;
    d = (a + 44) | 0;
    f[d >> 2] = 2147483647;
    e = (a + 16) | 0;
    g = (a + 20) | 0;
    i = (a + 24) | 0;
    j = (a + 28) | 0;
    k = (a + 32) | 0;
    l = (a + 36) | 0;
    m = (a + 40) | 0;
    o = h[(a + 12) >> 0] | 0;
    p = (c + 4) | 0;
    q = h[(a + 13) >> 0] | 0;
    r = (c + 8) | 0;
    s = h[(a + 14) >> 0] | 0;
    a = f[c >> 2] | 0;
    t = h[(a + ((o * 6) | 0) + 2) >> 0] | 0;
    u = W(t, t) | 0;
    t = f[p >> 2] | 0;
    v = h[(t + ((q * 6) | 0) + 2) >> 0] | 0;
    w = ((W(v, v) | 0) + u) | 0;
    u = f[r >> 2] | 0;
    v = h[(u + ((s * 6) | 0) + 2) >> 0] | 0;
    x = ((W(v, v) | 0) + w) | 0;
    y = +(h[(t + ((q * 6) | 0)) >> 0] | 0) / 63.0;
    z = +(h[(u + ((s * 6) | 0)) >> 0] | 0) / 31.0;
    n[e >> 2] = +(h[(a + ((o * 6) | 0)) >> 0] | 0) / 31.0;
    n[g >> 2] = y;
    n[i >> 2] = z;
    z = +(h[(t + ((q * 6) | 0) + 1) >> 0] | 0) / 63.0;
    y = +(h[(u + ((s * 6) | 0) + 1) >> 0] | 0) / 31.0;
    n[j >> 2] = +(h[(a + ((o * 6) | 0) + 1) >> 0] | 0) / 31.0;
    n[k >> 2] = z;
    n[l >> 2] = y;
    b[m >> 0] = 0;
    f[d >> 2] = x;
    a = f[c >> 2] | 0;
    c = h[(a + ((o * 6) | 0) + 5) >> 0] | 0;
    u = W(c, c) | 0;
    c = f[p >> 2] | 0;
    p = h[(c + ((q * 6) | 0) + 5) >> 0] | 0;
    t = ((W(p, p) | 0) + u) | 0;
    u = f[r >> 2] | 0;
    r = h[(u + ((s * 6) | 0) + 5) >> 0] | 0;
    p = ((W(r, r) | 0) + t) | 0;
    if ((p | 0) >= (x | 0)) return;
    y = +(h[(c + ((q * 6) | 0) + 3) >> 0] | 0) / 63.0;
    z = +(h[(u + ((s * 6) | 0) + 3) >> 0] | 0) / 31.0;
    n[e >> 2] = +(h[(a + ((o * 6) | 0) + 3) >> 0] | 0) / 31.0;
    n[g >> 2] = y;
    n[i >> 2] = z;
    z = +(h[(c + ((q * 6) | 0) + 4) >> 0] | 0) / 63.0;
    y = +(h[(u + ((s * 6) | 0) + 4) >> 0] | 0) / 31.0;
    n[j >> 2] = +(h[(a + ((o * 6) | 0) + 4) >> 0] | 0) / 31.0;
    n[k >> 2] = z;
    n[l >> 2] = y;
    b[m >> 0] = 2;
    f[d >> 2] = p;
    return;
  }
  function nb(a, c, d) {
    a = a | 0;
    c = c | 0;
    d = d | 0;
    ab(a, c, d);
    f[a >> 2] = 176;
    d = f[(a + 4) >> 2] | 0;
    c = ~~(+n[(d + 4) >> 2] * 255.0 + 0.5);
    b[(a + 12) >> 0] = (c | 0) < 0 ? 0 : ((c | 0) < 255 ? c : 255) & 255;
    c = ~~(+n[(d + 8) >> 2] * 255.0 + 0.5);
    b[(a + 13) >> 0] = (c | 0) < 0 ? 0 : ((c | 0) < 255 ? c : 255) & 255;
    c = ~~(+n[(d + 12) >> 2] * 255.0 + 0.5);
    b[(a + 14) >> 0] = (c | 0) < 0 ? 0 : ((c | 0) < 255 ? c : 255) & 255;
    f[(a + 48) >> 2] = 2147483647;
    return;
  }
  function ob(a, b, c, d) {
    a = a | 0;
    b = b | 0;
    c = c | 0;
    d = d | 0;
    var e = 0,
      g = 0,
      h = 0,
      i = 0,
      j = 0,
      k = 0,
      l = 0;
    e = u;
    u = (u + 800) | 0;
    g = (e + 464) | 0;
    h = e;
    i = d & 7;
    j = (i | 0) == 4 ? 4 : (i | 0) == 2 ? 2 : 1;
    i = ((d & 280) | 0) == 16 ? 16 : 8;
    k = i | (d & 128) | (((d & 96) | 0) == 64 ? 64 : 32) | j;
    d = ((j & 6) | 0) == 0 ? c : (c + 8) | 0;
    cb(g, a, b, k);
    l = f[g >> 2] | 0;
    do
      if ((l | 0) != 1)
        if ((((i & 16) | 0) != 0) | ((l | 0) == 0)) {
          jb(h, g, k);
          bb(h, d);
          break;
        } else {
          Ya(h, g, k);
          bb(h, d);
          break;
        }
      else {
        nb(h, g, k);
        bb(h, d);
      }
    while (0);
    if ((j & 2) | 0) {
      Qa(a, b, c);
      u = e;
      return;
    }
    if (!(j & 4)) {
      u = e;
      return;
    }
    Sa(a, b, c);
    u = e;
    return;
  }
  function pb(a, c, d, e, f) {
    a = a | 0;
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
      v = 0,
      w = 0,
      x = 0,
      y = 0,
      z = 0,
      A = 0,
      B = 0,
      C = 0,
      D = 0;
    g = u;
    u = (u + 64) | 0;
    h = g;
    i = f & 7;
    j = (i | 0) == 4 ? 4 : (i | 0) == 2 ? 2 : 1;
    i =
      (((f & 280) | 0) == 16 ? 16 : 8) |
      (f & 128) |
      (((f & 96) | 0) == 64 ? 64 : 32) |
      j;
    f = ((((j << 3) & 8) ^ 8) + 8) | 0;
    if ((d | 0) <= 0) {
      u = g;
      return;
    }
    if ((c | 0) > 0) {
      k = e;
      l = 0;
    } else {
      u = g;
      return;
    }
    while (1) {
      e = 0;
      j = k;
      do {
        m = e | 1;
        n = (m | 0) < (c | 0);
        o = e | 2;
        p = (o | 0) < (c | 0);
        q = e | 3;
        r = (q | 0) < (c | 0);
        s = 0;
        t = 0;
        v = h;
        while (1) {
          w = (s + l) | 0;
          x = W(w, c) | 0;
          y = s << 2;
          if ((w | 0) < (d | 0)) {
            w = (a + ((e + x) << 2)) | 0;
            z = (w + 1) | 0;
            b[v >> 0] = b[w >> 0] | 0;
            w = (z + 1) | 0;
            b[(v + 1) >> 0] = b[z >> 0] | 0;
            b[(v + 2) >> 0] = b[w >> 0] | 0;
            b[(v + 3) >> 0] = b[(w + 1) >> 0] | 0;
            w = (1 << y) | t;
            if (n) {
              z = (a + ((m + x) << 2)) | 0;
              A = (z + 1) | 0;
              b[(v + 4) >> 0] = b[z >> 0] | 0;
              z = (A + 1) | 0;
              b[(v + 5) >> 0] = b[A >> 0] | 0;
              b[(v + 6) >> 0] = b[z >> 0] | 0;
              b[(v + 7) >> 0] = b[(z + 1) >> 0] | 0;
              B = (1 << (y | 1)) | w;
            } else B = w;
            if (p) {
              w = (a + ((o + x) << 2)) | 0;
              z = (w + 1) | 0;
              b[(v + 8) >> 0] = b[w >> 0] | 0;
              w = (z + 1) | 0;
              b[(v + 9) >> 0] = b[z >> 0] | 0;
              b[(v + 10) >> 0] = b[w >> 0] | 0;
              b[(v + 11) >> 0] = b[(w + 1) >> 0] | 0;
              C = (1 << (y | 2)) | B;
            } else C = B;
            if (r) {
              w = (a + ((q + x) << 2)) | 0;
              x = (w + 1) | 0;
              b[(v + 12) >> 0] = b[w >> 0] | 0;
              w = (x + 1) | 0;
              b[(v + 13) >> 0] = b[x >> 0] | 0;
              b[(v + 14) >> 0] = b[w >> 0] | 0;
              b[(v + 15) >> 0] = b[(w + 1) >> 0] | 0;
              D = (1 << (y | 3)) | C;
            } else D = C;
          } else D = t;
          s = (s + 1) | 0;
          if ((s | 0) == 4) break;
          else {
            t = D;
            v = (v + 16) | 0;
          }
        }
        ob(h, D, j, i);
        j = (j + f) | 0;
        e = (e + 4) | 0;
      } while ((e | 0) < (c | 0));
      l = (l + 4) | 0;
      if ((l | 0) >= (d | 0)) break;
      else k = j;
    }
    u = g;
    return;
  }
  function qb(a, c, d, e, f) {
    a = a | 0;
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
      v = 0,
      w = 0,
      x = 0,
      y = 0,
      z = 0,
      A = 0,
      B = 0,
      C = 0,
      D = 0,
      E = 0;
    g = u;
    u = (u + 64) | 0;
    h = g;
    i = f & 7;
    f = (i | 0) == 4;
    j = f ? 4 : (i | 0) == 2 ? 2 : 1;
    i = ((((j << 3) & 8) ^ 8) + 8) | 0;
    if ((d | 0) <= 0) {
      u = g;
      return;
    }
    k = (c | 0) > 0;
    l = f ? 4 : (j | 0) == 2 ? 2 : 1;
    j = ((l & 6) | 0) == 0;
    f = ((l & 1) | 0) != 0;
    m = ((l & 2) | 0) == 0;
    n = ((l & 4) | 0) == 0;
    l = e;
    e = 0;
    while (1) {
      a: do
        if (k) {
          if (m) {
            o = 0;
            p = l;
          } else {
            q = 0;
            r = l;
            while (1) {
              $a(h, j ? r : (r + 8) | 0, f);
              Ra(h, r);
              s = q | 1;
              t = (s | 0) < (c | 0);
              v = q | 2;
              w = (v | 0) < (c | 0);
              x = q | 3;
              y = (x | 0) < (c | 0);
              z = 0;
              A = h;
              while (1) {
                B = (z + e) | 0;
                C = W(B, c) | 0;
                if ((B | 0) < (d | 0)) {
                  B = (a + ((q + C) << 2)) | 0;
                  D = (B + 1) | 0;
                  b[B >> 0] = b[A >> 0] | 0;
                  B = (D + 1) | 0;
                  b[D >> 0] = b[(A + 1) >> 0] | 0;
                  b[B >> 0] = b[(A + 2) >> 0] | 0;
                  b[(B + 1) >> 0] = b[(A + 3) >> 0] | 0;
                  if (t) {
                    B = (a + ((s + C) << 2)) | 0;
                    D = (B + 1) | 0;
                    b[B >> 0] = b[(A + 4) >> 0] | 0;
                    B = (D + 1) | 0;
                    b[D >> 0] = b[(A + 5) >> 0] | 0;
                    b[B >> 0] = b[(A + 6) >> 0] | 0;
                    b[(B + 1) >> 0] = b[(A + 7) >> 0] | 0;
                  }
                  if (w) {
                    B = (a + ((v + C) << 2)) | 0;
                    D = (B + 1) | 0;
                    b[B >> 0] = b[(A + 8) >> 0] | 0;
                    B = (D + 1) | 0;
                    b[D >> 0] = b[(A + 9) >> 0] | 0;
                    b[B >> 0] = b[(A + 10) >> 0] | 0;
                    b[(B + 1) >> 0] = b[(A + 11) >> 0] | 0;
                  }
                  if (y) {
                    B = (a + ((x + C) << 2)) | 0;
                    C = (B + 1) | 0;
                    b[B >> 0] = b[(A + 12) >> 0] | 0;
                    B = (C + 1) | 0;
                    b[C >> 0] = b[(A + 13) >> 0] | 0;
                    b[B >> 0] = b[(A + 14) >> 0] | 0;
                    b[(B + 1) >> 0] = b[(A + 15) >> 0] | 0;
                  }
                }
                z = (z + 1) | 0;
                if ((z | 0) == 4) break;
                else A = (A + 16) | 0;
              }
              A = (r + i) | 0;
              q = (q + 4) | 0;
              if ((q | 0) >= (c | 0)) {
                E = A;
                break a;
              } else r = A;
            }
          }
          while (1) {
            $a(h, j ? p : (p + 8) | 0, f);
            if (!n) Ua(h, p);
            r = o | 1;
            q = (r | 0) < (c | 0);
            A = o | 2;
            z = (A | 0) < (c | 0);
            x = o | 3;
            y = (x | 0) < (c | 0);
            v = 0;
            w = h;
            while (1) {
              s = (v + e) | 0;
              t = W(s, c) | 0;
              if ((s | 0) < (d | 0)) {
                s = (a + ((o + t) << 2)) | 0;
                B = (s + 1) | 0;
                b[s >> 0] = b[w >> 0] | 0;
                s = (B + 1) | 0;
                b[B >> 0] = b[(w + 1) >> 0] | 0;
                b[s >> 0] = b[(w + 2) >> 0] | 0;
                b[(s + 1) >> 0] = b[(w + 3) >> 0] | 0;
                if (q) {
                  s = (a + ((r + t) << 2)) | 0;
                  B = (s + 1) | 0;
                  b[s >> 0] = b[(w + 4) >> 0] | 0;
                  s = (B + 1) | 0;
                  b[B >> 0] = b[(w + 5) >> 0] | 0;
                  b[s >> 0] = b[(w + 6) >> 0] | 0;
                  b[(s + 1) >> 0] = b[(w + 7) >> 0] | 0;
                }
                if (z) {
                  s = (a + ((A + t) << 2)) | 0;
                  B = (s + 1) | 0;
                  b[s >> 0] = b[(w + 8) >> 0] | 0;
                  s = (B + 1) | 0;
                  b[B >> 0] = b[(w + 9) >> 0] | 0;
                  b[s >> 0] = b[(w + 10) >> 0] | 0;
                  b[(s + 1) >> 0] = b[(w + 11) >> 0] | 0;
                }
                if (y) {
                  s = (a + ((x + t) << 2)) | 0;
                  t = (s + 1) | 0;
                  b[s >> 0] = b[(w + 12) >> 0] | 0;
                  s = (t + 1) | 0;
                  b[t >> 0] = b[(w + 13) >> 0] | 0;
                  b[s >> 0] = b[(w + 14) >> 0] | 0;
                  b[(s + 1) >> 0] = b[(w + 15) >> 0] | 0;
                }
              }
              v = (v + 1) | 0;
              if ((v | 0) == 4) break;
              else w = (w + 16) | 0;
            }
            w = (p + i) | 0;
            o = (o + 4) | 0;
            if ((o | 0) >= (c | 0)) {
              E = w;
              break;
            } else p = w;
          }
        } else E = l;
      while (0);
      e = (e + 4) | 0;
      if ((e | 0) >= (d | 0)) break;
      else l = E;
    }
    u = g;
    return;
  }
  function rb(a, b, c) {
    a = a | 0;
    b = b | 0;
    c = c | 0;
    var d = 0;
    d = c & 7;
    return (
      W(
        W((((b + 3) | 0) / 4) | 0, (((a + 3) | 0) / 4) | 0) | 0,
        ((((((d | 0) != 2) & ((d | 0) != 4) & 1) << 3) ^ 8) + 8) | 0
      ) | 0
    );
  }
  function sb(a, b, c, d, e) {
    a = a | 0;
    b = b | 0;
    c = c | 0;
    d = d | 0;
    e = e | 0;
    pb(a, b, c, d, e);
    return;
  }
  function tb(a, b, c, d, e) {
    a = a | 0;
    b = b | 0;
    c = c | 0;
    d = d | 0;
    e = e | 0;
    qb(a, b, c, d, e);
    return;
  }
  function ub(a) {
    a = a | 0;
    var b = 0,
      c = 0,
      d = 0,
      e = 0,
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
      J = 0,
      K = 0,
      L = 0,
      M = 0,
      N = 0,
      O = 0,
      P = 0,
      Q = 0,
      R = 0,
      S = 0,
      T = 0,
      U = 0,
      V = 0,
      W = 0,
      X = 0,
      Y = 0,
      Z = 0,
      _ = 0,
      $ = 0,
      aa = 0,
      ba = 0,
      ca = 0,
      da = 0,
      ea = 0,
      fa = 0,
      ga = 0,
      ha = 0,
      ia = 0,
      ja = 0,
      ka = 0,
      la = 0,
      ma = 0,
      na = 0,
      oa = 0,
      pa = 0,
      qa = 0,
      ra = 0,
      sa = 0,
      ta = 0,
      ua = 0,
      va = 0,
      wa = 0,
      xa = 0,
      ya = 0;
    b = u;
    u = (u + 16) | 0;
    c = b;
    do
      if (a >>> 0 < 245) {
        d = a >>> 0 < 11 ? 16 : (a + 11) & -8;
        e = d >>> 3;
        g = f[1754] | 0;
        h = g >>> e;
        if ((h & 3) | 0) {
          i = (((h & 1) ^ 1) + e) | 0;
          j = (7056 + ((i << 1) << 2)) | 0;
          k = (j + 8) | 0;
          l = f[k >> 2] | 0;
          m = (l + 8) | 0;
          n = f[m >> 2] | 0;
          if ((j | 0) == (n | 0)) f[1754] = g & ~(1 << i);
          else {
            f[(n + 12) >> 2] = j;
            f[k >> 2] = n;
          }
          n = i << 3;
          f[(l + 4) >> 2] = n | 3;
          i = (l + n + 4) | 0;
          f[i >> 2] = f[i >> 2] | 1;
          o = m;
          u = b;
          return o | 0;
        }
        m = f[1756] | 0;
        if (d >>> 0 > m >>> 0) {
          if (h | 0) {
            i = 2 << e;
            n = (h << e) & (i | (0 - i));
            i = ((n & (0 - n)) + -1) | 0;
            n = (i >>> 12) & 16;
            e = i >>> n;
            i = (e >>> 5) & 8;
            h = e >>> i;
            e = (h >>> 2) & 4;
            l = h >>> e;
            h = (l >>> 1) & 2;
            k = l >>> h;
            l = (k >>> 1) & 1;
            j = ((i | n | e | h | l) + (k >>> l)) | 0;
            l = (7056 + ((j << 1) << 2)) | 0;
            k = (l + 8) | 0;
            h = f[k >> 2] | 0;
            e = (h + 8) | 0;
            n = f[e >> 2] | 0;
            if ((l | 0) == (n | 0)) {
              i = g & ~(1 << j);
              f[1754] = i;
              p = i;
            } else {
              f[(n + 12) >> 2] = l;
              f[k >> 2] = n;
              p = g;
            }
            n = ((j << 3) - d) | 0;
            f[(h + 4) >> 2] = d | 3;
            j = (h + d) | 0;
            f[(j + 4) >> 2] = n | 1;
            f[(j + n) >> 2] = n;
            if (m | 0) {
              h = f[1759] | 0;
              k = m >>> 3;
              l = (7056 + ((k << 1) << 2)) | 0;
              i = 1 << k;
              if (!(p & i)) {
                f[1754] = p | i;
                q = l;
                r = (l + 8) | 0;
              } else {
                i = (l + 8) | 0;
                q = f[i >> 2] | 0;
                r = i;
              }
              f[r >> 2] = h;
              f[(q + 12) >> 2] = h;
              f[(h + 8) >> 2] = q;
              f[(h + 12) >> 2] = l;
            }
            f[1756] = n;
            f[1759] = j;
            o = e;
            u = b;
            return o | 0;
          }
          e = f[1755] | 0;
          if (e) {
            j = ((e & (0 - e)) + -1) | 0;
            n = (j >>> 12) & 16;
            l = j >>> n;
            j = (l >>> 5) & 8;
            h = l >>> j;
            l = (h >>> 2) & 4;
            i = h >>> l;
            h = (i >>> 1) & 2;
            k = i >>> h;
            i = (k >>> 1) & 1;
            s = f[(7320 + (((j | n | l | h | i) + (k >>> i)) << 2)) >> 2] | 0;
            i = ((f[(s + 4) >> 2] & -8) - d) | 0;
            k =
              f[(s + 16 + ((((f[(s + 16) >> 2] | 0) == 0) & 1) << 2)) >> 2] | 0;
            if (!k) {
              t = s;
              v = i;
            } else {
              h = s;
              s = i;
              i = k;
              while (1) {
                k = ((f[(i + 4) >> 2] & -8) - d) | 0;
                l = k >>> 0 < s >>> 0;
                n = l ? k : s;
                k = l ? i : h;
                i =
                  f[
                    (i + 16 + ((((f[(i + 16) >> 2] | 0) == 0) & 1) << 2)) >> 2
                  ] | 0;
                if (!i) {
                  t = k;
                  v = n;
                  break;
                } else {
                  h = k;
                  s = n;
                }
              }
            }
            s = (t + d) | 0;
            if (t >>> 0 < s >>> 0) {
              h = f[(t + 24) >> 2] | 0;
              i = f[(t + 12) >> 2] | 0;
              do
                if ((i | 0) == (t | 0)) {
                  n = (t + 20) | 0;
                  k = f[n >> 2] | 0;
                  if (!k) {
                    l = (t + 16) | 0;
                    j = f[l >> 2] | 0;
                    if (!j) {
                      w = 0;
                      break;
                    } else {
                      x = j;
                      y = l;
                    }
                  } else {
                    x = k;
                    y = n;
                  }
                  while (1) {
                    n = (x + 20) | 0;
                    k = f[n >> 2] | 0;
                    if (k | 0) {
                      x = k;
                      y = n;
                      continue;
                    }
                    n = (x + 16) | 0;
                    k = f[n >> 2] | 0;
                    if (!k) break;
                    else {
                      x = k;
                      y = n;
                    }
                  }
                  f[y >> 2] = 0;
                  w = x;
                } else {
                  n = f[(t + 8) >> 2] | 0;
                  f[(n + 12) >> 2] = i;
                  f[(i + 8) >> 2] = n;
                  w = i;
                }
              while (0);
              do
                if (h | 0) {
                  i = f[(t + 28) >> 2] | 0;
                  n = (7320 + (i << 2)) | 0;
                  if ((t | 0) == (f[n >> 2] | 0)) {
                    f[n >> 2] = w;
                    if (!w) {
                      f[1755] = e & ~(1 << i);
                      break;
                    }
                  } else {
                    f[
                      (h +
                        16 +
                        ((((f[(h + 16) >> 2] | 0) != (t | 0)) & 1) << 2)) >>
                        2
                    ] = w;
                    if (!w) break;
                  }
                  f[(w + 24) >> 2] = h;
                  i = f[(t + 16) >> 2] | 0;
                  if (i | 0) {
                    f[(w + 16) >> 2] = i;
                    f[(i + 24) >> 2] = w;
                  }
                  i = f[(t + 20) >> 2] | 0;
                  if (i | 0) {
                    f[(w + 20) >> 2] = i;
                    f[(i + 24) >> 2] = w;
                  }
                }
              while (0);
              if (v >>> 0 < 16) {
                h = (v + d) | 0;
                f[(t + 4) >> 2] = h | 3;
                e = (t + h + 4) | 0;
                f[e >> 2] = f[e >> 2] | 1;
              } else {
                f[(t + 4) >> 2] = d | 3;
                f[(s + 4) >> 2] = v | 1;
                f[(s + v) >> 2] = v;
                if (m | 0) {
                  e = f[1759] | 0;
                  h = m >>> 3;
                  i = (7056 + ((h << 1) << 2)) | 0;
                  n = 1 << h;
                  if (!(g & n)) {
                    f[1754] = g | n;
                    z = i;
                    A = (i + 8) | 0;
                  } else {
                    n = (i + 8) | 0;
                    z = f[n >> 2] | 0;
                    A = n;
                  }
                  f[A >> 2] = e;
                  f[(z + 12) >> 2] = e;
                  f[(e + 8) >> 2] = z;
                  f[(e + 12) >> 2] = i;
                }
                f[1756] = v;
                f[1759] = s;
              }
              o = (t + 8) | 0;
              u = b;
              return o | 0;
            } else B = d;
          } else B = d;
        } else B = d;
      } else if (a >>> 0 <= 4294967231) {
        i = (a + 11) | 0;
        e = i & -8;
        n = f[1755] | 0;
        if (n) {
          h = (0 - e) | 0;
          k = i >>> 8;
          if (k)
            if (e >>> 0 > 16777215) C = 31;
            else {
              i = (((k + 1048320) | 0) >>> 16) & 8;
              l = k << i;
              k = (((l + 520192) | 0) >>> 16) & 4;
              j = l << k;
              l = (((j + 245760) | 0) >>> 16) & 2;
              D = (14 - (k | i | l) + ((j << l) >>> 15)) | 0;
              C = ((e >>> ((D + 7) | 0)) & 1) | (D << 1);
            }
          else C = 0;
          D = f[(7320 + (C << 2)) >> 2] | 0;
          a: do
            if (!D) {
              E = 0;
              F = 0;
              G = h;
              H = 57;
            } else {
              l = 0;
              j = h;
              i = D;
              k = e << ((C | 0) == 31 ? 0 : (25 - (C >>> 1)) | 0);
              I = 0;
              while (1) {
                J = ((f[(i + 4) >> 2] & -8) - e) | 0;
                if (J >>> 0 < j >>> 0)
                  if (!J) {
                    K = i;
                    L = 0;
                    M = i;
                    H = 61;
                    break a;
                  } else {
                    N = i;
                    O = J;
                  }
                else {
                  N = l;
                  O = j;
                }
                J = f[(i + 20) >> 2] | 0;
                i = f[(i + 16 + ((k >>> 31) << 2)) >> 2] | 0;
                P = ((J | 0) == 0) | ((J | 0) == (i | 0)) ? I : J;
                J = (i | 0) == 0;
                if (J) {
                  E = P;
                  F = N;
                  G = O;
                  H = 57;
                  break;
                } else {
                  l = N;
                  j = O;
                  k = k << ((J ^ 1) & 1);
                  I = P;
                }
              }
            }
          while (0);
          if ((H | 0) == 57) {
            if (((E | 0) == 0) & ((F | 0) == 0)) {
              D = 2 << C;
              h = n & (D | (0 - D));
              if (!h) {
                B = e;
                break;
              }
              D = ((h & (0 - h)) + -1) | 0;
              h = (D >>> 12) & 16;
              d = D >>> h;
              D = (d >>> 5) & 8;
              s = d >>> D;
              d = (s >>> 2) & 4;
              g = s >>> d;
              s = (g >>> 1) & 2;
              m = g >>> s;
              g = (m >>> 1) & 1;
              Q = 0;
              R = f[(7320 + (((D | h | d | s | g) + (m >>> g)) << 2)) >> 2] | 0;
            } else {
              Q = F;
              R = E;
            }
            if (!R) {
              S = Q;
              T = G;
            } else {
              K = Q;
              L = G;
              M = R;
              H = 61;
            }
          }
          if ((H | 0) == 61)
            while (1) {
              H = 0;
              g = ((f[(M + 4) >> 2] & -8) - e) | 0;
              m = g >>> 0 < L >>> 0;
              s = m ? g : L;
              g = m ? M : K;
              M =
                f[(M + 16 + ((((f[(M + 16) >> 2] | 0) == 0) & 1) << 2)) >> 2] |
                0;
              if (!M) {
                S = g;
                T = s;
                break;
              } else {
                K = g;
                L = s;
                H = 61;
              }
            }
          if ((S | 0) != 0 ? T >>> 0 < (((f[1756] | 0) - e) | 0) >>> 0 : 0) {
            s = (S + e) | 0;
            if (S >>> 0 >= s >>> 0) {
              o = 0;
              u = b;
              return o | 0;
            }
            g = f[(S + 24) >> 2] | 0;
            m = f[(S + 12) >> 2] | 0;
            do
              if ((m | 0) == (S | 0)) {
                d = (S + 20) | 0;
                h = f[d >> 2] | 0;
                if (!h) {
                  D = (S + 16) | 0;
                  I = f[D >> 2] | 0;
                  if (!I) {
                    U = 0;
                    break;
                  } else {
                    V = I;
                    W = D;
                  }
                } else {
                  V = h;
                  W = d;
                }
                while (1) {
                  d = (V + 20) | 0;
                  h = f[d >> 2] | 0;
                  if (h | 0) {
                    V = h;
                    W = d;
                    continue;
                  }
                  d = (V + 16) | 0;
                  h = f[d >> 2] | 0;
                  if (!h) break;
                  else {
                    V = h;
                    W = d;
                  }
                }
                f[W >> 2] = 0;
                U = V;
              } else {
                d = f[(S + 8) >> 2] | 0;
                f[(d + 12) >> 2] = m;
                f[(m + 8) >> 2] = d;
                U = m;
              }
            while (0);
            do
              if (g) {
                m = f[(S + 28) >> 2] | 0;
                d = (7320 + (m << 2)) | 0;
                if ((S | 0) == (f[d >> 2] | 0)) {
                  f[d >> 2] = U;
                  if (!U) {
                    d = n & ~(1 << m);
                    f[1755] = d;
                    X = d;
                    break;
                  }
                } else {
                  f[
                    (g +
                      16 +
                      ((((f[(g + 16) >> 2] | 0) != (S | 0)) & 1) << 2)) >>
                      2
                  ] = U;
                  if (!U) {
                    X = n;
                    break;
                  }
                }
                f[(U + 24) >> 2] = g;
                d = f[(S + 16) >> 2] | 0;
                if (d | 0) {
                  f[(U + 16) >> 2] = d;
                  f[(d + 24) >> 2] = U;
                }
                d = f[(S + 20) >> 2] | 0;
                if (d) {
                  f[(U + 20) >> 2] = d;
                  f[(d + 24) >> 2] = U;
                  X = n;
                } else X = n;
              } else X = n;
            while (0);
            do
              if (T >>> 0 >= 16) {
                f[(S + 4) >> 2] = e | 3;
                f[(s + 4) >> 2] = T | 1;
                f[(s + T) >> 2] = T;
                n = T >>> 3;
                if (T >>> 0 < 256) {
                  g = (7056 + ((n << 1) << 2)) | 0;
                  d = f[1754] | 0;
                  m = 1 << n;
                  if (!(d & m)) {
                    f[1754] = d | m;
                    Y = g;
                    Z = (g + 8) | 0;
                  } else {
                    m = (g + 8) | 0;
                    Y = f[m >> 2] | 0;
                    Z = m;
                  }
                  f[Z >> 2] = s;
                  f[(Y + 12) >> 2] = s;
                  f[(s + 8) >> 2] = Y;
                  f[(s + 12) >> 2] = g;
                  break;
                }
                g = T >>> 8;
                if (g)
                  if (T >>> 0 > 16777215) _ = 31;
                  else {
                    m = (((g + 1048320) | 0) >>> 16) & 8;
                    d = g << m;
                    g = (((d + 520192) | 0) >>> 16) & 4;
                    n = d << g;
                    d = (((n + 245760) | 0) >>> 16) & 2;
                    h = (14 - (g | m | d) + ((n << d) >>> 15)) | 0;
                    _ = ((T >>> ((h + 7) | 0)) & 1) | (h << 1);
                  }
                else _ = 0;
                h = (7320 + (_ << 2)) | 0;
                f[(s + 28) >> 2] = _;
                d = (s + 16) | 0;
                f[(d + 4) >> 2] = 0;
                f[d >> 2] = 0;
                d = 1 << _;
                if (!(X & d)) {
                  f[1755] = X | d;
                  f[h >> 2] = s;
                  f[(s + 24) >> 2] = h;
                  f[(s + 12) >> 2] = s;
                  f[(s + 8) >> 2] = s;
                  break;
                }
                d = T << ((_ | 0) == 31 ? 0 : (25 - (_ >>> 1)) | 0);
                n = f[h >> 2] | 0;
                while (1) {
                  if (((f[(n + 4) >> 2] & -8) | 0) == (T | 0)) {
                    H = 97;
                    break;
                  }
                  $ = (n + 16 + ((d >>> 31) << 2)) | 0;
                  h = f[$ >> 2] | 0;
                  if (!h) {
                    H = 96;
                    break;
                  } else {
                    d = d << 1;
                    n = h;
                  }
                }
                if ((H | 0) == 96) {
                  f[$ >> 2] = s;
                  f[(s + 24) >> 2] = n;
                  f[(s + 12) >> 2] = s;
                  f[(s + 8) >> 2] = s;
                  break;
                } else if ((H | 0) == 97) {
                  d = (n + 8) | 0;
                  h = f[d >> 2] | 0;
                  f[(h + 12) >> 2] = s;
                  f[d >> 2] = s;
                  f[(s + 8) >> 2] = h;
                  f[(s + 12) >> 2] = n;
                  f[(s + 24) >> 2] = 0;
                  break;
                }
              } else {
                h = (T + e) | 0;
                f[(S + 4) >> 2] = h | 3;
                d = (S + h + 4) | 0;
                f[d >> 2] = f[d >> 2] | 1;
              }
            while (0);
            o = (S + 8) | 0;
            u = b;
            return o | 0;
          } else B = e;
        } else B = e;
      } else B = -1;
    while (0);
    S = f[1756] | 0;
    if (S >>> 0 >= B >>> 0) {
      T = (S - B) | 0;
      $ = f[1759] | 0;
      if (T >>> 0 > 15) {
        _ = ($ + B) | 0;
        f[1759] = _;
        f[1756] = T;
        f[(_ + 4) >> 2] = T | 1;
        f[(_ + T) >> 2] = T;
        f[($ + 4) >> 2] = B | 3;
      } else {
        f[1756] = 0;
        f[1759] = 0;
        f[($ + 4) >> 2] = S | 3;
        T = ($ + S + 4) | 0;
        f[T >> 2] = f[T >> 2] | 1;
      }
      o = ($ + 8) | 0;
      u = b;
      return o | 0;
    }
    $ = f[1757] | 0;
    if ($ >>> 0 > B >>> 0) {
      T = ($ - B) | 0;
      f[1757] = T;
      S = f[1760] | 0;
      _ = (S + B) | 0;
      f[1760] = _;
      f[(_ + 4) >> 2] = T | 1;
      f[(S + 4) >> 2] = B | 3;
      o = (S + 8) | 0;
      u = b;
      return o | 0;
    }
    if (!(f[1872] | 0)) {
      f[1874] = 4096;
      f[1873] = 4096;
      f[1875] = -1;
      f[1876] = -1;
      f[1877] = 0;
      f[1865] = 0;
      S = (c & -16) ^ 1431655768;
      f[c >> 2] = S;
      f[1872] = S;
      aa = 4096;
    } else aa = f[1874] | 0;
    S = (B + 48) | 0;
    c = (B + 47) | 0;
    T = (aa + c) | 0;
    _ = (0 - aa) | 0;
    aa = T & _;
    if (aa >>> 0 <= B >>> 0) {
      o = 0;
      u = b;
      return o | 0;
    }
    X = f[1864] | 0;
    if (
      X | 0
        ? ((Y = f[1862] | 0),
          (Z = (Y + aa) | 0),
          (Z >>> 0 <= Y >>> 0) | (Z >>> 0 > X >>> 0))
        : 0
    ) {
      o = 0;
      u = b;
      return o | 0;
    }
    b: do
      if (!(f[1865] & 4)) {
        X = f[1760] | 0;
        c: do
          if (X) {
            Z = 7464;
            while (1) {
              Y = f[Z >> 2] | 0;
              if (
                Y >>> 0 <= X >>> 0
                  ? ((ba = (Z + 4) | 0),
                    ((Y + (f[ba >> 2] | 0)) | 0) >>> 0 > X >>> 0)
                  : 0
              )
                break;
              Y = f[(Z + 8) >> 2] | 0;
              if (!Y) {
                H = 118;
                break c;
              } else Z = Y;
            }
            n = (T - $) & _;
            if (n >>> 0 < 2147483647) {
              Y = ec(n | 0) | 0;
              if ((Y | 0) == (((f[Z >> 2] | 0) + (f[ba >> 2] | 0)) | 0))
                if ((Y | 0) == (-1 | 0)) ca = n;
                else {
                  da = n;
                  ea = Y;
                  H = 135;
                  break b;
                }
              else {
                fa = Y;
                ga = n;
                H = 126;
              }
            } else ca = 0;
          } else H = 118;
        while (0);
        do
          if ((H | 0) == 118) {
            X = ec(0) | 0;
            if (
              (X | 0) != (-1 | 0)
                ? ((e = X),
                  (n = f[1873] | 0),
                  (Y = (n + -1) | 0),
                  (U =
                    ((((Y & e) | 0) == 0 ? 0 : (((Y + e) & (0 - n)) - e) | 0) +
                      aa) |
                    0),
                  (e = f[1862] | 0),
                  (n = (U + e) | 0),
                  (U >>> 0 > B >>> 0) & (U >>> 0 < 2147483647))
                : 0
            ) {
              Y = f[1864] | 0;
              if (Y | 0 ? (n >>> 0 <= e >>> 0) | (n >>> 0 > Y >>> 0) : 0) {
                ca = 0;
                break;
              }
              Y = ec(U | 0) | 0;
              if ((Y | 0) == (X | 0)) {
                da = U;
                ea = X;
                H = 135;
                break b;
              } else {
                fa = Y;
                ga = U;
                H = 126;
              }
            } else ca = 0;
          }
        while (0);
        do
          if ((H | 0) == 126) {
            U = (0 - ga) | 0;
            if (
              !(
                (S >>> 0 > ga >>> 0) &
                ((ga >>> 0 < 2147483647) & ((fa | 0) != (-1 | 0)))
              )
            )
              if ((fa | 0) == (-1 | 0)) {
                ca = 0;
                break;
              } else {
                da = ga;
                ea = fa;
                H = 135;
                break b;
              }
            Y = f[1874] | 0;
            X = (c - ga + Y) & (0 - Y);
            if (X >>> 0 >= 2147483647) {
              da = ga;
              ea = fa;
              H = 135;
              break b;
            }
            if ((ec(X | 0) | 0) == (-1 | 0)) {
              ec(U | 0) | 0;
              ca = 0;
              break;
            } else {
              da = (X + ga) | 0;
              ea = fa;
              H = 135;
              break b;
            }
          }
        while (0);
        f[1865] = f[1865] | 4;
        ha = ca;
        H = 133;
      } else {
        ha = 0;
        H = 133;
      }
    while (0);
    if (
      ((H | 0) == 133 ? aa >>> 0 < 2147483647 : 0)
        ? ((ca = ec(aa | 0) | 0),
          (aa = ec(0) | 0),
          (fa = (aa - ca) | 0),
          (ga = fa >>> 0 > ((B + 40) | 0) >>> 0),
          !(
            ((ca | 0) == (-1 | 0)) |
            (ga ^ 1) |
            (((ca >>> 0 < aa >>> 0) &
              (((ca | 0) != (-1 | 0)) & ((aa | 0) != (-1 | 0)))) ^
              1)
          ))
        : 0
    ) {
      da = ga ? fa : ha;
      ea = ca;
      H = 135;
    }
    if ((H | 0) == 135) {
      ca = ((f[1862] | 0) + da) | 0;
      f[1862] = ca;
      if (ca >>> 0 > (f[1863] | 0) >>> 0) f[1863] = ca;
      ca = f[1760] | 0;
      do
        if (ca) {
          ha = 7464;
          while (1) {
            ia = f[ha >> 2] | 0;
            ja = (ha + 4) | 0;
            ka = f[ja >> 2] | 0;
            if ((ea | 0) == ((ia + ka) | 0)) {
              H = 145;
              break;
            }
            fa = f[(ha + 8) >> 2] | 0;
            if (!fa) break;
            else ha = fa;
          }
          if (
            ((H | 0) == 145 ? ((f[(ha + 12) >> 2] & 8) | 0) == 0 : 0)
              ? (ca >>> 0 < ea >>> 0) & (ca >>> 0 >= ia >>> 0)
              : 0
          ) {
            f[ja >> 2] = ka + da;
            fa = (ca + 8) | 0;
            ga = ((fa & 7) | 0) == 0 ? 0 : (0 - fa) & 7;
            fa = (ca + ga) | 0;
            aa = ((f[1757] | 0) + (da - ga)) | 0;
            f[1760] = fa;
            f[1757] = aa;
            f[(fa + 4) >> 2] = aa | 1;
            f[(fa + aa + 4) >> 2] = 40;
            f[1761] = f[1876];
            break;
          }
          if (ea >>> 0 < (f[1758] | 0) >>> 0) f[1758] = ea;
          aa = (ea + da) | 0;
          fa = 7464;
          while (1) {
            if ((f[fa >> 2] | 0) == (aa | 0)) {
              H = 153;
              break;
            }
            ga = f[(fa + 8) >> 2] | 0;
            if (!ga) break;
            else fa = ga;
          }
          if ((H | 0) == 153 ? ((f[(fa + 12) >> 2] & 8) | 0) == 0 : 0) {
            f[fa >> 2] = ea;
            ha = (fa + 4) | 0;
            f[ha >> 2] = (f[ha >> 2] | 0) + da;
            ha = (ea + 8) | 0;
            ga = (ea + (((ha & 7) | 0) == 0 ? 0 : (0 - ha) & 7)) | 0;
            ha = (aa + 8) | 0;
            c = (aa + (((ha & 7) | 0) == 0 ? 0 : (0 - ha) & 7)) | 0;
            ha = (ga + B) | 0;
            S = (c - ga - B) | 0;
            f[(ga + 4) >> 2] = B | 3;
            do
              if ((c | 0) != (ca | 0)) {
                if ((c | 0) == (f[1759] | 0)) {
                  ba = ((f[1756] | 0) + S) | 0;
                  f[1756] = ba;
                  f[1759] = ha;
                  f[(ha + 4) >> 2] = ba | 1;
                  f[(ha + ba) >> 2] = ba;
                  break;
                }
                ba = f[(c + 4) >> 2] | 0;
                if (((ba & 3) | 0) == 1) {
                  _ = ba & -8;
                  $ = ba >>> 3;
                  d: do
                    if (ba >>> 0 < 256) {
                      T = f[(c + 8) >> 2] | 0;
                      X = f[(c + 12) >> 2] | 0;
                      if ((X | 0) == (T | 0)) {
                        f[1754] = f[1754] & ~(1 << $);
                        break;
                      } else {
                        f[(T + 12) >> 2] = X;
                        f[(X + 8) >> 2] = T;
                        break;
                      }
                    } else {
                      T = f[(c + 24) >> 2] | 0;
                      X = f[(c + 12) >> 2] | 0;
                      do
                        if ((X | 0) == (c | 0)) {
                          U = (c + 16) | 0;
                          Y = (U + 4) | 0;
                          n = f[Y >> 2] | 0;
                          if (!n) {
                            e = f[U >> 2] | 0;
                            if (!e) {
                              la = 0;
                              break;
                            } else {
                              ma = e;
                              na = U;
                            }
                          } else {
                            ma = n;
                            na = Y;
                          }
                          while (1) {
                            Y = (ma + 20) | 0;
                            n = f[Y >> 2] | 0;
                            if (n | 0) {
                              ma = n;
                              na = Y;
                              continue;
                            }
                            Y = (ma + 16) | 0;
                            n = f[Y >> 2] | 0;
                            if (!n) break;
                            else {
                              ma = n;
                              na = Y;
                            }
                          }
                          f[na >> 2] = 0;
                          la = ma;
                        } else {
                          Y = f[(c + 8) >> 2] | 0;
                          f[(Y + 12) >> 2] = X;
                          f[(X + 8) >> 2] = Y;
                          la = X;
                        }
                      while (0);
                      if (!T) break;
                      X = f[(c + 28) >> 2] | 0;
                      Y = (7320 + (X << 2)) | 0;
                      do
                        if ((c | 0) != (f[Y >> 2] | 0)) {
                          f[
                            (T +
                              16 +
                              ((((f[(T + 16) >> 2] | 0) != (c | 0)) & 1) <<
                                2)) >>
                              2
                          ] = la;
                          if (!la) break d;
                        } else {
                          f[Y >> 2] = la;
                          if (la | 0) break;
                          f[1755] = f[1755] & ~(1 << X);
                          break d;
                        }
                      while (0);
                      f[(la + 24) >> 2] = T;
                      X = (c + 16) | 0;
                      Y = f[X >> 2] | 0;
                      if (Y | 0) {
                        f[(la + 16) >> 2] = Y;
                        f[(Y + 24) >> 2] = la;
                      }
                      Y = f[(X + 4) >> 2] | 0;
                      if (!Y) break;
                      f[(la + 20) >> 2] = Y;
                      f[(Y + 24) >> 2] = la;
                    }
                  while (0);
                  oa = (c + _) | 0;
                  pa = (_ + S) | 0;
                } else {
                  oa = c;
                  pa = S;
                }
                $ = (oa + 4) | 0;
                f[$ >> 2] = f[$ >> 2] & -2;
                f[(ha + 4) >> 2] = pa | 1;
                f[(ha + pa) >> 2] = pa;
                $ = pa >>> 3;
                if (pa >>> 0 < 256) {
                  ba = (7056 + (($ << 1) << 2)) | 0;
                  Z = f[1754] | 0;
                  Y = 1 << $;
                  if (!(Z & Y)) {
                    f[1754] = Z | Y;
                    qa = ba;
                    ra = (ba + 8) | 0;
                  } else {
                    Y = (ba + 8) | 0;
                    qa = f[Y >> 2] | 0;
                    ra = Y;
                  }
                  f[ra >> 2] = ha;
                  f[(qa + 12) >> 2] = ha;
                  f[(ha + 8) >> 2] = qa;
                  f[(ha + 12) >> 2] = ba;
                  break;
                }
                ba = pa >>> 8;
                do
                  if (!ba) sa = 0;
                  else {
                    if (pa >>> 0 > 16777215) {
                      sa = 31;
                      break;
                    }
                    Y = (((ba + 1048320) | 0) >>> 16) & 8;
                    Z = ba << Y;
                    $ = (((Z + 520192) | 0) >>> 16) & 4;
                    X = Z << $;
                    Z = (((X + 245760) | 0) >>> 16) & 2;
                    n = (14 - ($ | Y | Z) + ((X << Z) >>> 15)) | 0;
                    sa = ((pa >>> ((n + 7) | 0)) & 1) | (n << 1);
                  }
                while (0);
                ba = (7320 + (sa << 2)) | 0;
                f[(ha + 28) >> 2] = sa;
                _ = (ha + 16) | 0;
                f[(_ + 4) >> 2] = 0;
                f[_ >> 2] = 0;
                _ = f[1755] | 0;
                n = 1 << sa;
                if (!(_ & n)) {
                  f[1755] = _ | n;
                  f[ba >> 2] = ha;
                  f[(ha + 24) >> 2] = ba;
                  f[(ha + 12) >> 2] = ha;
                  f[(ha + 8) >> 2] = ha;
                  break;
                }
                n = pa << ((sa | 0) == 31 ? 0 : (25 - (sa >>> 1)) | 0);
                _ = f[ba >> 2] | 0;
                while (1) {
                  if (((f[(_ + 4) >> 2] & -8) | 0) == (pa | 0)) {
                    H = 194;
                    break;
                  }
                  ta = (_ + 16 + ((n >>> 31) << 2)) | 0;
                  ba = f[ta >> 2] | 0;
                  if (!ba) {
                    H = 193;
                    break;
                  } else {
                    n = n << 1;
                    _ = ba;
                  }
                }
                if ((H | 0) == 193) {
                  f[ta >> 2] = ha;
                  f[(ha + 24) >> 2] = _;
                  f[(ha + 12) >> 2] = ha;
                  f[(ha + 8) >> 2] = ha;
                  break;
                } else if ((H | 0) == 194) {
                  n = (_ + 8) | 0;
                  ba = f[n >> 2] | 0;
                  f[(ba + 12) >> 2] = ha;
                  f[n >> 2] = ha;
                  f[(ha + 8) >> 2] = ba;
                  f[(ha + 12) >> 2] = _;
                  f[(ha + 24) >> 2] = 0;
                  break;
                }
              } else {
                ba = ((f[1757] | 0) + S) | 0;
                f[1757] = ba;
                f[1760] = ha;
                f[(ha + 4) >> 2] = ba | 1;
              }
            while (0);
            o = (ga + 8) | 0;
            u = b;
            return o | 0;
          }
          ha = 7464;
          while (1) {
            S = f[ha >> 2] | 0;
            if (
              S >>> 0 <= ca >>> 0
                ? ((ua = (S + (f[(ha + 4) >> 2] | 0)) | 0), ua >>> 0 > ca >>> 0)
                : 0
            )
              break;
            ha = f[(ha + 8) >> 2] | 0;
          }
          ha = (ua + -47) | 0;
          ga = (ha + 8) | 0;
          S = (ha + (((ga & 7) | 0) == 0 ? 0 : (0 - ga) & 7)) | 0;
          ga = (ca + 16) | 0;
          ha = S >>> 0 < ga >>> 0 ? ca : S;
          S = (ha + 8) | 0;
          c = (ea + 8) | 0;
          aa = ((c & 7) | 0) == 0 ? 0 : (0 - c) & 7;
          c = (ea + aa) | 0;
          fa = (da + -40 - aa) | 0;
          f[1760] = c;
          f[1757] = fa;
          f[(c + 4) >> 2] = fa | 1;
          f[(c + fa + 4) >> 2] = 40;
          f[1761] = f[1876];
          fa = (ha + 4) | 0;
          f[fa >> 2] = 27;
          f[S >> 2] = f[1866];
          f[(S + 4) >> 2] = f[1867];
          f[(S + 8) >> 2] = f[1868];
          f[(S + 12) >> 2] = f[1869];
          f[1866] = ea;
          f[1867] = da;
          f[1869] = 0;
          f[1868] = S;
          S = (ha + 24) | 0;
          do {
            c = S;
            S = (S + 4) | 0;
            f[S >> 2] = 7;
          } while (((c + 8) | 0) >>> 0 < ua >>> 0);
          if ((ha | 0) != (ca | 0)) {
            S = (ha - ca) | 0;
            f[fa >> 2] = f[fa >> 2] & -2;
            f[(ca + 4) >> 2] = S | 1;
            f[ha >> 2] = S;
            c = S >>> 3;
            if (S >>> 0 < 256) {
              aa = (7056 + ((c << 1) << 2)) | 0;
              ba = f[1754] | 0;
              n = 1 << c;
              if (!(ba & n)) {
                f[1754] = ba | n;
                va = aa;
                wa = (aa + 8) | 0;
              } else {
                n = (aa + 8) | 0;
                va = f[n >> 2] | 0;
                wa = n;
              }
              f[wa >> 2] = ca;
              f[(va + 12) >> 2] = ca;
              f[(ca + 8) >> 2] = va;
              f[(ca + 12) >> 2] = aa;
              break;
            }
            aa = S >>> 8;
            if (aa)
              if (S >>> 0 > 16777215) xa = 31;
              else {
                n = (((aa + 1048320) | 0) >>> 16) & 8;
                ba = aa << n;
                aa = (((ba + 520192) | 0) >>> 16) & 4;
                c = ba << aa;
                ba = (((c + 245760) | 0) >>> 16) & 2;
                Z = (14 - (aa | n | ba) + ((c << ba) >>> 15)) | 0;
                xa = ((S >>> ((Z + 7) | 0)) & 1) | (Z << 1);
              }
            else xa = 0;
            Z = (7320 + (xa << 2)) | 0;
            f[(ca + 28) >> 2] = xa;
            f[(ca + 20) >> 2] = 0;
            f[ga >> 2] = 0;
            ba = f[1755] | 0;
            c = 1 << xa;
            if (!(ba & c)) {
              f[1755] = ba | c;
              f[Z >> 2] = ca;
              f[(ca + 24) >> 2] = Z;
              f[(ca + 12) >> 2] = ca;
              f[(ca + 8) >> 2] = ca;
              break;
            }
            c = S << ((xa | 0) == 31 ? 0 : (25 - (xa >>> 1)) | 0);
            ba = f[Z >> 2] | 0;
            while (1) {
              if (((f[(ba + 4) >> 2] & -8) | 0) == (S | 0)) {
                H = 216;
                break;
              }
              ya = (ba + 16 + ((c >>> 31) << 2)) | 0;
              Z = f[ya >> 2] | 0;
              if (!Z) {
                H = 215;
                break;
              } else {
                c = c << 1;
                ba = Z;
              }
            }
            if ((H | 0) == 215) {
              f[ya >> 2] = ca;
              f[(ca + 24) >> 2] = ba;
              f[(ca + 12) >> 2] = ca;
              f[(ca + 8) >> 2] = ca;
              break;
            } else if ((H | 0) == 216) {
              c = (ba + 8) | 0;
              S = f[c >> 2] | 0;
              f[(S + 12) >> 2] = ca;
              f[c >> 2] = ca;
              f[(ca + 8) >> 2] = S;
              f[(ca + 12) >> 2] = ba;
              f[(ca + 24) >> 2] = 0;
              break;
            }
          }
        } else {
          S = f[1758] | 0;
          if (((S | 0) == 0) | (ea >>> 0 < S >>> 0)) f[1758] = ea;
          f[1866] = ea;
          f[1867] = da;
          f[1869] = 0;
          f[1763] = f[1872];
          f[1762] = -1;
          S = 0;
          do {
            c = (7056 + ((S << 1) << 2)) | 0;
            f[(c + 12) >> 2] = c;
            f[(c + 8) >> 2] = c;
            S = (S + 1) | 0;
          } while ((S | 0) != 32);
          S = (ea + 8) | 0;
          ba = ((S & 7) | 0) == 0 ? 0 : (0 - S) & 7;
          S = (ea + ba) | 0;
          c = (da + -40 - ba) | 0;
          f[1760] = S;
          f[1757] = c;
          f[(S + 4) >> 2] = c | 1;
          f[(S + c + 4) >> 2] = 40;
          f[1761] = f[1876];
        }
      while (0);
      da = f[1757] | 0;
      if (da >>> 0 > B >>> 0) {
        ea = (da - B) | 0;
        f[1757] = ea;
        da = f[1760] | 0;
        ca = (da + B) | 0;
        f[1760] = ca;
        f[(ca + 4) >> 2] = ea | 1;
        f[(da + 4) >> 2] = B | 3;
        o = (da + 8) | 0;
        u = b;
        return o | 0;
      }
    }
    da = Ab() | 0;
    f[da >> 2] = 12;
    o = 0;
    u = b;
    return o | 0;
  }
  function vb(a) {
    a = a | 0;
    var b = 0,
      c = 0,
      d = 0,
      e = 0,
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
      A = 0,
      B = 0,
      C = 0,
      D = 0;
    if (!a) return;
    b = (a + -8) | 0;
    c = f[1758] | 0;
    d = f[(a + -4) >> 2] | 0;
    a = d & -8;
    e = (b + a) | 0;
    do
      if (!(d & 1)) {
        g = f[b >> 2] | 0;
        if (!(d & 3)) return;
        h = (b + (0 - g)) | 0;
        i = (g + a) | 0;
        if (h >>> 0 < c >>> 0) return;
        if ((h | 0) == (f[1759] | 0)) {
          j = (e + 4) | 0;
          k = f[j >> 2] | 0;
          if (((k & 3) | 0) != 3) {
            l = h;
            m = i;
            n = h;
            break;
          }
          f[1756] = i;
          f[j >> 2] = k & -2;
          f[(h + 4) >> 2] = i | 1;
          f[(h + i) >> 2] = i;
          return;
        }
        k = g >>> 3;
        if (g >>> 0 < 256) {
          g = f[(h + 8) >> 2] | 0;
          j = f[(h + 12) >> 2] | 0;
          if ((j | 0) == (g | 0)) {
            f[1754] = f[1754] & ~(1 << k);
            l = h;
            m = i;
            n = h;
            break;
          } else {
            f[(g + 12) >> 2] = j;
            f[(j + 8) >> 2] = g;
            l = h;
            m = i;
            n = h;
            break;
          }
        }
        g = f[(h + 24) >> 2] | 0;
        j = f[(h + 12) >> 2] | 0;
        do
          if ((j | 0) == (h | 0)) {
            k = (h + 16) | 0;
            o = (k + 4) | 0;
            p = f[o >> 2] | 0;
            if (!p) {
              q = f[k >> 2] | 0;
              if (!q) {
                r = 0;
                break;
              } else {
                s = q;
                t = k;
              }
            } else {
              s = p;
              t = o;
            }
            while (1) {
              o = (s + 20) | 0;
              p = f[o >> 2] | 0;
              if (p | 0) {
                s = p;
                t = o;
                continue;
              }
              o = (s + 16) | 0;
              p = f[o >> 2] | 0;
              if (!p) break;
              else {
                s = p;
                t = o;
              }
            }
            f[t >> 2] = 0;
            r = s;
          } else {
            o = f[(h + 8) >> 2] | 0;
            f[(o + 12) >> 2] = j;
            f[(j + 8) >> 2] = o;
            r = j;
          }
        while (0);
        if (g) {
          j = f[(h + 28) >> 2] | 0;
          o = (7320 + (j << 2)) | 0;
          if ((h | 0) == (f[o >> 2] | 0)) {
            f[o >> 2] = r;
            if (!r) {
              f[1755] = f[1755] & ~(1 << j);
              l = h;
              m = i;
              n = h;
              break;
            }
          } else {
            f[
              (g + 16 + ((((f[(g + 16) >> 2] | 0) != (h | 0)) & 1) << 2)) >> 2
            ] = r;
            if (!r) {
              l = h;
              m = i;
              n = h;
              break;
            }
          }
          f[(r + 24) >> 2] = g;
          j = (h + 16) | 0;
          o = f[j >> 2] | 0;
          if (o | 0) {
            f[(r + 16) >> 2] = o;
            f[(o + 24) >> 2] = r;
          }
          o = f[(j + 4) >> 2] | 0;
          if (o) {
            f[(r + 20) >> 2] = o;
            f[(o + 24) >> 2] = r;
            l = h;
            m = i;
            n = h;
          } else {
            l = h;
            m = i;
            n = h;
          }
        } else {
          l = h;
          m = i;
          n = h;
        }
      } else {
        l = b;
        m = a;
        n = b;
      }
    while (0);
    if (n >>> 0 >= e >>> 0) return;
    b = (e + 4) | 0;
    a = f[b >> 2] | 0;
    if (!(a & 1)) return;
    if (!(a & 2)) {
      r = f[1759] | 0;
      if ((e | 0) == (f[1760] | 0)) {
        s = ((f[1757] | 0) + m) | 0;
        f[1757] = s;
        f[1760] = l;
        f[(l + 4) >> 2] = s | 1;
        if ((l | 0) != (r | 0)) return;
        f[1759] = 0;
        f[1756] = 0;
        return;
      }
      if ((e | 0) == (r | 0)) {
        r = ((f[1756] | 0) + m) | 0;
        f[1756] = r;
        f[1759] = n;
        f[(l + 4) >> 2] = r | 1;
        f[(n + r) >> 2] = r;
        return;
      }
      r = ((a & -8) + m) | 0;
      s = a >>> 3;
      do
        if (a >>> 0 < 256) {
          t = f[(e + 8) >> 2] | 0;
          c = f[(e + 12) >> 2] | 0;
          if ((c | 0) == (t | 0)) {
            f[1754] = f[1754] & ~(1 << s);
            break;
          } else {
            f[(t + 12) >> 2] = c;
            f[(c + 8) >> 2] = t;
            break;
          }
        } else {
          t = f[(e + 24) >> 2] | 0;
          c = f[(e + 12) >> 2] | 0;
          do
            if ((c | 0) == (e | 0)) {
              d = (e + 16) | 0;
              o = (d + 4) | 0;
              j = f[o >> 2] | 0;
              if (!j) {
                p = f[d >> 2] | 0;
                if (!p) {
                  u = 0;
                  break;
                } else {
                  v = p;
                  w = d;
                }
              } else {
                v = j;
                w = o;
              }
              while (1) {
                o = (v + 20) | 0;
                j = f[o >> 2] | 0;
                if (j | 0) {
                  v = j;
                  w = o;
                  continue;
                }
                o = (v + 16) | 0;
                j = f[o >> 2] | 0;
                if (!j) break;
                else {
                  v = j;
                  w = o;
                }
              }
              f[w >> 2] = 0;
              u = v;
            } else {
              o = f[(e + 8) >> 2] | 0;
              f[(o + 12) >> 2] = c;
              f[(c + 8) >> 2] = o;
              u = c;
            }
          while (0);
          if (t | 0) {
            c = f[(e + 28) >> 2] | 0;
            h = (7320 + (c << 2)) | 0;
            if ((e | 0) == (f[h >> 2] | 0)) {
              f[h >> 2] = u;
              if (!u) {
                f[1755] = f[1755] & ~(1 << c);
                break;
              }
            } else {
              f[
                (t + 16 + ((((f[(t + 16) >> 2] | 0) != (e | 0)) & 1) << 2)) >> 2
              ] = u;
              if (!u) break;
            }
            f[(u + 24) >> 2] = t;
            c = (e + 16) | 0;
            h = f[c >> 2] | 0;
            if (h | 0) {
              f[(u + 16) >> 2] = h;
              f[(h + 24) >> 2] = u;
            }
            h = f[(c + 4) >> 2] | 0;
            if (h | 0) {
              f[(u + 20) >> 2] = h;
              f[(h + 24) >> 2] = u;
            }
          }
        }
      while (0);
      f[(l + 4) >> 2] = r | 1;
      f[(n + r) >> 2] = r;
      if ((l | 0) == (f[1759] | 0)) {
        f[1756] = r;
        return;
      } else x = r;
    } else {
      f[b >> 2] = a & -2;
      f[(l + 4) >> 2] = m | 1;
      f[(n + m) >> 2] = m;
      x = m;
    }
    m = x >>> 3;
    if (x >>> 0 < 256) {
      n = (7056 + ((m << 1) << 2)) | 0;
      a = f[1754] | 0;
      b = 1 << m;
      if (!(a & b)) {
        f[1754] = a | b;
        y = n;
        z = (n + 8) | 0;
      } else {
        b = (n + 8) | 0;
        y = f[b >> 2] | 0;
        z = b;
      }
      f[z >> 2] = l;
      f[(y + 12) >> 2] = l;
      f[(l + 8) >> 2] = y;
      f[(l + 12) >> 2] = n;
      return;
    }
    n = x >>> 8;
    if (n)
      if (x >>> 0 > 16777215) A = 31;
      else {
        y = (((n + 1048320) | 0) >>> 16) & 8;
        z = n << y;
        n = (((z + 520192) | 0) >>> 16) & 4;
        b = z << n;
        z = (((b + 245760) | 0) >>> 16) & 2;
        a = (14 - (n | y | z) + ((b << z) >>> 15)) | 0;
        A = ((x >>> ((a + 7) | 0)) & 1) | (a << 1);
      }
    else A = 0;
    a = (7320 + (A << 2)) | 0;
    f[(l + 28) >> 2] = A;
    f[(l + 20) >> 2] = 0;
    f[(l + 16) >> 2] = 0;
    z = f[1755] | 0;
    b = 1 << A;
    do
      if (z & b) {
        y = x << ((A | 0) == 31 ? 0 : (25 - (A >>> 1)) | 0);
        n = f[a >> 2] | 0;
        while (1) {
          if (((f[(n + 4) >> 2] & -8) | 0) == (x | 0)) {
            B = 73;
            break;
          }
          C = (n + 16 + ((y >>> 31) << 2)) | 0;
          m = f[C >> 2] | 0;
          if (!m) {
            B = 72;
            break;
          } else {
            y = y << 1;
            n = m;
          }
        }
        if ((B | 0) == 72) {
          f[C >> 2] = l;
          f[(l + 24) >> 2] = n;
          f[(l + 12) >> 2] = l;
          f[(l + 8) >> 2] = l;
          break;
        } else if ((B | 0) == 73) {
          y = (n + 8) | 0;
          t = f[y >> 2] | 0;
          f[(t + 12) >> 2] = l;
          f[y >> 2] = l;
          f[(l + 8) >> 2] = t;
          f[(l + 12) >> 2] = n;
          f[(l + 24) >> 2] = 0;
          break;
        }
      } else {
        f[1755] = z | b;
        f[a >> 2] = l;
        f[(l + 24) >> 2] = a;
        f[(l + 12) >> 2] = l;
        f[(l + 8) >> 2] = l;
      }
    while (0);
    l = ((f[1762] | 0) + -1) | 0;
    f[1762] = l;
    if (!l) D = 7472;
    else return;
    while (1) {
      l = f[D >> 2] | 0;
      if (!l) break;
      else D = (l + 8) | 0;
    }
    f[1762] = -1;
    return;
  }
  function wb() {
    return 7512;
  }
  function xb(a) {
    a = a | 0;
    var b = 0,
      c = 0,
      d = 0;
    b = u;
    u = (u + 16) | 0;
    c = b;
    d = Db(f[(a + 60) >> 2] | 0) | 0;
    f[c >> 2] = d;
    d = zb(ma(6, c | 0) | 0) | 0;
    u = b;
    return d | 0;
  }
  function yb(a, b, c) {
    a = a | 0;
    b = b | 0;
    c = c | 0;
    var d = 0,
      e = 0,
      g = 0,
      h = 0;
    d = u;
    u = (u + 32) | 0;
    e = d;
    g = (d + 20) | 0;
    f[e >> 2] = f[(a + 60) >> 2];
    f[(e + 4) >> 2] = 0;
    f[(e + 8) >> 2] = b;
    f[(e + 12) >> 2] = g;
    f[(e + 16) >> 2] = c;
    if ((zb(oa(140, e | 0) | 0) | 0) < 0) {
      f[g >> 2] = -1;
      h = -1;
    } else h = f[g >> 2] | 0;
    u = d;
    return h | 0;
  }
  function zb(a) {
    a = a | 0;
    var b = 0,
      c = 0;
    if (a >>> 0 > 4294963200) {
      b = Ab() | 0;
      f[b >> 2] = 0 - a;
      c = -1;
    } else c = a;
    return c | 0;
  }
  function Ab() {
    return ((Bb() | 0) + 64) | 0;
  }
  function Bb() {
    return Cb() | 0;
  }
  function Cb() {
    return 208;
  }
  function Db(a) {
    a = a | 0;
    return a | 0;
  }
  function Eb(a, b, c) {
    a = a | 0;
    b = b | 0;
    c = c | 0;
    var d = 0,
      e = 0,
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
      v = 0,
      w = 0;
    d = u;
    u = (u + 48) | 0;
    e = (d + 16) | 0;
    g = d;
    h = (d + 32) | 0;
    i = (a + 28) | 0;
    j = f[i >> 2] | 0;
    f[h >> 2] = j;
    k = (a + 20) | 0;
    l = ((f[k >> 2] | 0) - j) | 0;
    f[(h + 4) >> 2] = l;
    f[(h + 8) >> 2] = b;
    f[(h + 12) >> 2] = c;
    b = (l + c) | 0;
    l = (a + 60) | 0;
    f[g >> 2] = f[l >> 2];
    f[(g + 4) >> 2] = h;
    f[(g + 8) >> 2] = 2;
    j = zb(xa(146, g | 0) | 0) | 0;
    a: do
      if ((b | 0) != (j | 0)) {
        g = 2;
        m = b;
        n = h;
        o = j;
        while (1) {
          if ((o | 0) < 0) break;
          m = (m - o) | 0;
          p = f[(n + 4) >> 2] | 0;
          q = o >>> 0 > p >>> 0;
          r = q ? (n + 8) | 0 : n;
          s = (((q << 31) >> 31) + g) | 0;
          t = (o - (q ? p : 0)) | 0;
          f[r >> 2] = (f[r >> 2] | 0) + t;
          p = (r + 4) | 0;
          f[p >> 2] = (f[p >> 2] | 0) - t;
          f[e >> 2] = f[l >> 2];
          f[(e + 4) >> 2] = r;
          f[(e + 8) >> 2] = s;
          o = zb(xa(146, e | 0) | 0) | 0;
          if ((m | 0) == (o | 0)) {
            v = 3;
            break a;
          } else {
            g = s;
            n = r;
          }
        }
        f[(a + 16) >> 2] = 0;
        f[i >> 2] = 0;
        f[k >> 2] = 0;
        f[a >> 2] = f[a >> 2] | 32;
        if ((g | 0) == 2) w = 0;
        else w = (c - (f[(n + 4) >> 2] | 0)) | 0;
      } else v = 3;
    while (0);
    if ((v | 0) == 3) {
      v = f[(a + 44) >> 2] | 0;
      f[(a + 16) >> 2] = v + (f[(a + 48) >> 2] | 0);
      f[i >> 2] = v;
      f[k >> 2] = v;
      w = c;
    }
    u = d;
    return w | 0;
  }
  function Fb(a, c, d) {
    a = a | 0;
    c = c | 0;
    d = d | 0;
    var e = 0,
      g = 0;
    e = u;
    u = (u + 32) | 0;
    g = e;
    f[(a + 36) >> 2] = 4;
    if (
      ((f[a >> 2] & 64) | 0) == 0
        ? ((f[g >> 2] = f[(a + 60) >> 2]),
          (f[(g + 4) >> 2] = 21523),
          (f[(g + 8) >> 2] = e + 16),
          sa(54, g | 0) | 0)
        : 0
    )
      b[(a + 75) >> 0] = -1;
    g = Eb(a, c, d) | 0;
    u = e;
    return g | 0;
  }
  function Gb(a) {
    a = a | 0;
    return 0;
  }
  function Hb(a) {
    a = a | 0;
    return;
  }
  function Ib() {
    la(7576);
    return 7584;
  }
  function Jb() {
    ta(7576);
    return;
  }
  function Kb(a) {
    a = a | 0;
    var b = 0,
      c = 0,
      d = 0,
      e = 0,
      g = 0,
      h = 0,
      i = 0;
    do
      if (a) {
        if ((f[(a + 76) >> 2] | 0) <= -1) {
          b = Lb(a) | 0;
          break;
        }
        c = (Gb(a) | 0) == 0;
        d = Lb(a) | 0;
        if (c) b = d;
        else {
          Hb(a);
          b = d;
        }
      } else {
        if (!(f[144] | 0)) e = 0;
        else e = Kb(f[144] | 0) | 0;
        d = Ib() | 0;
        c = f[d >> 2] | 0;
        if (!c) g = e;
        else {
          d = c;
          c = e;
          while (1) {
            if ((f[(d + 76) >> 2] | 0) > -1) h = Gb(d) | 0;
            else h = 0;
            if ((f[(d + 20) >> 2] | 0) >>> 0 > (f[(d + 28) >> 2] | 0) >>> 0)
              i = Lb(d) | 0 | c;
            else i = c;
            if (h | 0) Hb(d);
            d = f[(d + 56) >> 2] | 0;
            if (!d) {
              g = i;
              break;
            } else c = i;
          }
        }
        Jb();
        b = g;
      }
    while (0);
    return b | 0;
  }
  function Lb(a) {
    a = a | 0;
    var b = 0,
      c = 0,
      d = 0,
      e = 0,
      g = 0,
      h = 0,
      i = 0;
    b = (a + 20) | 0;
    c = (a + 28) | 0;
    if (
      (f[b >> 2] | 0) >>> 0 > (f[c >> 2] | 0) >>> 0
        ? (Ba[f[(a + 36) >> 2] & 7](a, 0, 0) | 0, (f[b >> 2] | 0) == 0)
        : 0
    )
      d = -1;
    else {
      e = (a + 4) | 0;
      g = f[e >> 2] | 0;
      h = (a + 8) | 0;
      i = f[h >> 2] | 0;
      if (g >>> 0 < i >>> 0) Ba[f[(a + 40) >> 2] & 7](a, (g - i) | 0, 1) | 0;
      f[(a + 16) >> 2] = 0;
      f[c >> 2] = 0;
      f[b >> 2] = 0;
      f[h >> 2] = 0;
      f[e >> 2] = 0;
      d = 0;
    }
    return d | 0;
  }
  function Mb(a) {
    a = a | 0;
    return;
  }
  function Nb(a) {
    a = a | 0;
    Mb(a);
    bc(a);
    return;
  }
  function Ob(a) {
    a = a | 0;
    return;
  }
  function Pb(a) {
    a = a | 0;
    return;
  }
  function Qb(a, b, c) {
    a = a | 0;
    b = b | 0;
    c = c | 0;
    var d = 0,
      e = 0,
      g = 0,
      h = 0,
      i = 0,
      j = 0;
    d = u;
    u = (u + 64) | 0;
    e = d;
    if (!(Ub(a, b, 0) | 0))
      if ((b | 0) != 0 ? ((g = Yb(b, 80, 64, 0) | 0), (g | 0) != 0) : 0) {
        b = (e + 4) | 0;
        h = (b + 52) | 0;
        do {
          f[b >> 2] = 0;
          b = (b + 4) | 0;
        } while ((b | 0) < (h | 0));
        f[e >> 2] = g;
        f[(e + 8) >> 2] = a;
        f[(e + 12) >> 2] = -1;
        f[(e + 48) >> 2] = 1;
        Ia[f[((f[g >> 2] | 0) + 28) >> 2] & 3](g, e, f[c >> 2] | 0, 1);
        if ((f[(e + 24) >> 2] | 0) == 1) {
          f[c >> 2] = f[(e + 16) >> 2];
          i = 1;
        } else i = 0;
        j = i;
      } else j = 0;
    else j = 1;
    u = d;
    return j | 0;
  }
  function Rb(a, b, c, d, e, g) {
    a = a | 0;
    b = b | 0;
    c = c | 0;
    d = d | 0;
    e = e | 0;
    g = g | 0;
    if (Ub(a, f[(b + 8) >> 2] | 0, g) | 0) Xb(0, b, c, d, e);
    return;
  }
  function Sb(a, c, d, e, g) {
    a = a | 0;
    c = c | 0;
    d = d | 0;
    e = e | 0;
    g = g | 0;
    var h = 0,
      i = 0;
    do
      if (!(Ub(a, f[(c + 8) >> 2] | 0, g) | 0)) {
        if (Ub(a, f[c >> 2] | 0, g) | 0) {
          h = (c + 32) | 0;
          if (
            (f[(c + 16) >> 2] | 0) != (d | 0)
              ? ((i = (c + 20) | 0), (f[i >> 2] | 0) != (d | 0))
              : 0
          ) {
            f[h >> 2] = e;
            f[i >> 2] = d;
            i = (c + 40) | 0;
            f[i >> 2] = (f[i >> 2] | 0) + 1;
            if ((f[(c + 36) >> 2] | 0) == 1 ? (f[(c + 24) >> 2] | 0) == 2 : 0)
              b[(c + 54) >> 0] = 1;
            f[(c + 44) >> 2] = 4;
            break;
          }
          if ((e | 0) == 1) f[h >> 2] = 1;
        }
      } else Wb(0, c, d, e);
    while (0);
    return;
  }
  function Tb(a, b, c, d) {
    a = a | 0;
    b = b | 0;
    c = c | 0;
    d = d | 0;
    if (Ub(a, f[(b + 8) >> 2] | 0, 0) | 0) Vb(0, b, c, d);
    return;
  }
  function Ub(a, b, c) {
    a = a | 0;
    b = b | 0;
    c = c | 0;
    return ((a | 0) == (b | 0)) | 0;
  }
  function Vb(a, c, d, e) {
    a = a | 0;
    c = c | 0;
    d = d | 0;
    e = e | 0;
    var g = 0,
      h = 0,
      i = 0;
    a = (c + 16) | 0;
    g = f[a >> 2] | 0;
    h = (c + 36) | 0;
    i = (c + 24) | 0;
    do
      if (g) {
        if ((g | 0) != (d | 0)) {
          f[h >> 2] = (f[h >> 2] | 0) + 1;
          f[i >> 2] = 2;
          b[(c + 54) >> 0] = 1;
          break;
        }
        if ((f[i >> 2] | 0) == 2) f[i >> 2] = e;
      } else {
        f[a >> 2] = d;
        f[i >> 2] = e;
        f[h >> 2] = 1;
      }
    while (0);
    return;
  }
  function Wb(a, b, c, d) {
    a = a | 0;
    b = b | 0;
    c = c | 0;
    d = d | 0;
    if (
      (f[(b + 4) >> 2] | 0) == (c | 0)
        ? ((c = (b + 28) | 0), (f[c >> 2] | 0) != 1)
        : 0
    )
      f[c >> 2] = d;
    return;
  }
  function Xb(a, c, d, e, g) {
    a = a | 0;
    c = c | 0;
    d = d | 0;
    e = e | 0;
    g = g | 0;
    var h = 0,
      i = 0,
      j = 0,
      k = 0,
      l = 0,
      m = 0;
    b[(c + 53) >> 0] = 1;
    do
      if ((f[(c + 4) >> 2] | 0) == (e | 0)) {
        b[(c + 52) >> 0] = 1;
        a = (c + 16) | 0;
        h = f[a >> 2] | 0;
        i = (c + 54) | 0;
        j = (c + 48) | 0;
        k = (c + 24) | 0;
        l = (c + 36) | 0;
        if (!h) {
          f[a >> 2] = d;
          f[k >> 2] = g;
          f[l >> 2] = 1;
          if (!(((f[j >> 2] | 0) == 1) & ((g | 0) == 1))) break;
          b[i >> 0] = 1;
          break;
        }
        if ((h | 0) != (d | 0)) {
          f[l >> 2] = (f[l >> 2] | 0) + 1;
          b[i >> 0] = 1;
          break;
        }
        l = f[k >> 2] | 0;
        if ((l | 0) == 2) {
          f[k >> 2] = g;
          m = g;
        } else m = l;
        if (((f[j >> 2] | 0) == 1) & ((m | 0) == 1)) b[i >> 0] = 1;
      }
    while (0);
    return;
  }
  function Yb(a, c, e, g) {
    a = a | 0;
    c = c | 0;
    e = e | 0;
    g = g | 0;
    var h = 0,
      i = 0,
      j = 0,
      k = 0,
      l = 0,
      m = 0,
      n = 0,
      o = 0,
      p = 0,
      q = 0;
    h = u;
    u = (u + 64) | 0;
    i = h;
    j = f[a >> 2] | 0;
    k = (a + (f[(j + -8) >> 2] | 0)) | 0;
    l = f[(j + -4) >> 2] | 0;
    f[i >> 2] = e;
    f[(i + 4) >> 2] = a;
    f[(i + 8) >> 2] = c;
    f[(i + 12) >> 2] = g;
    g = (i + 16) | 0;
    c = (i + 20) | 0;
    a = (i + 24) | 0;
    j = (i + 28) | 0;
    m = (i + 32) | 0;
    n = (i + 40) | 0;
    o = g;
    p = (o + 36) | 0;
    do {
      f[o >> 2] = 0;
      o = (o + 4) | 0;
    } while ((o | 0) < (p | 0));
    d[(g + 36) >> 1] = 0;
    b[(g + 38) >> 0] = 0;
    a: do
      if (Ub(l, e, 0) | 0) {
        f[(i + 48) >> 2] = 1;
        Ha[f[((f[l >> 2] | 0) + 20) >> 2] & 3](l, i, k, k, 1, 0);
        q = (f[a >> 2] | 0) == 1 ? k : 0;
      } else {
        Ca[f[((f[l >> 2] | 0) + 24) >> 2] & 3](l, i, k, 1, 0);
        switch (f[(i + 36) >> 2] | 0) {
          case 0: {
            q =
              ((f[n >> 2] | 0) == 1) &
              ((f[j >> 2] | 0) == 1) &
              ((f[m >> 2] | 0) == 1)
                ? f[c >> 2] | 0
                : 0;
            break a;
            break;
          }
          case 1:
            break;
          default: {
            q = 0;
            break a;
          }
        }
        if (
          (f[a >> 2] | 0) != 1
            ? !(
                ((f[n >> 2] | 0) == 0) &
                ((f[j >> 2] | 0) == 1) &
                ((f[m >> 2] | 0) == 1)
              )
            : 0
        ) {
          q = 0;
          break;
        }
        q = f[g >> 2] | 0;
      }
    while (0);
    u = h;
    return q | 0;
  }
  function Zb(a) {
    a = a | 0;
    Mb(a);
    bc(a);
    return;
  }
  function _b(a, b, c, d, e, g) {
    a = a | 0;
    b = b | 0;
    c = c | 0;
    d = d | 0;
    e = e | 0;
    g = g | 0;
    var h = 0;
    if (Ub(a, f[(b + 8) >> 2] | 0, g) | 0) Xb(0, b, c, d, e);
    else {
      h = f[(a + 8) >> 2] | 0;
      Ha[f[((f[h >> 2] | 0) + 20) >> 2] & 3](h, b, c, d, e, g);
    }
    return;
  }
  function $b(a, c, d, e, g) {
    a = a | 0;
    c = c | 0;
    d = d | 0;
    e = e | 0;
    g = g | 0;
    var h = 0,
      i = 0,
      j = 0,
      k = 0,
      l = 0,
      m = 0,
      n = 0,
      o = 0,
      p = 0,
      q = 0;
    do
      if (!(Ub(a, f[(c + 8) >> 2] | 0, g) | 0)) {
        h = (a + 8) | 0;
        if (!(Ub(a, f[c >> 2] | 0, g) | 0)) {
          i = f[h >> 2] | 0;
          Ca[f[((f[i >> 2] | 0) + 24) >> 2] & 3](i, c, d, e, g);
          break;
        }
        i = (c + 32) | 0;
        if (
          (f[(c + 16) >> 2] | 0) != (d | 0)
            ? ((j = (c + 20) | 0), (f[j >> 2] | 0) != (d | 0))
            : 0
        ) {
          f[i >> 2] = e;
          k = (c + 44) | 0;
          if ((f[k >> 2] | 0) == 4) break;
          l = (c + 52) | 0;
          b[l >> 0] = 0;
          m = (c + 53) | 0;
          b[m >> 0] = 0;
          n = f[h >> 2] | 0;
          Ha[f[((f[n >> 2] | 0) + 20) >> 2] & 3](n, c, d, d, 1, g);
          if (b[m >> 0] | 0)
            if (!(b[l >> 0] | 0)) {
              o = 3;
              p = 11;
            } else q = 3;
          else {
            o = 4;
            p = 11;
          }
          if ((p | 0) == 11) {
            f[j >> 2] = d;
            j = (c + 40) | 0;
            f[j >> 2] = (f[j >> 2] | 0) + 1;
            if ((f[(c + 36) >> 2] | 0) == 1 ? (f[(c + 24) >> 2] | 0) == 2 : 0) {
              b[(c + 54) >> 0] = 1;
              q = o;
            } else q = o;
          }
          f[k >> 2] = q;
          break;
        }
        if ((e | 0) == 1) f[i >> 2] = 1;
      } else Wb(0, c, d, e);
    while (0);
    return;
  }
  function ac(a, b, c, d) {
    a = a | 0;
    b = b | 0;
    c = c | 0;
    d = d | 0;
    var e = 0;
    if (Ub(a, f[(b + 8) >> 2] | 0, 0) | 0) Vb(0, b, c, d);
    else {
      e = f[(a + 8) >> 2] | 0;
      Ia[f[((f[e >> 2] | 0) + 28) >> 2] & 3](e, b, c, d);
    }
    return;
  }
  function bc(a) {
    a = a | 0;
    vb(a);
    return;
  }
  function cc(a) {
    a = a | 0;
    return;
  }
  function dc() {}
  function ec(a) {
    a = a | 0;
    var b = 0,
      c = 0;
    a = ((a + 15) & -16) | 0;
    b = f[r >> 2] | 0;
    c = (b + a) | 0;
    if ((((a | 0) > 0) & ((c | 0) < (b | 0))) | ((c | 0) < 0)) {
      ca() | 0;
      na(12);
      return -1;
    }
    f[r >> 2] = c;
    if ((c | 0) > (ba() | 0) ? (aa() | 0) == 0 : 0) {
      f[r >> 2] = b;
      na(12);
      return -1;
    }
    return b | 0;
  }
  function fc(a, c, d) {
    a = a | 0;
    c = c | 0;
    d = d | 0;
    var e = 0,
      g = 0,
      h = 0,
      i = 0;
    e = (a + d) | 0;
    c = c & 255;
    if ((d | 0) >= 67) {
      while (a & 3) {
        b[a >> 0] = c;
        a = (a + 1) | 0;
      }
      g = (e & -4) | 0;
      h = (g - 64) | 0;
      i = c | (c << 8) | (c << 16) | (c << 24);
      while ((a | 0) <= (h | 0)) {
        f[a >> 2] = i;
        f[(a + 4) >> 2] = i;
        f[(a + 8) >> 2] = i;
        f[(a + 12) >> 2] = i;
        f[(a + 16) >> 2] = i;
        f[(a + 20) >> 2] = i;
        f[(a + 24) >> 2] = i;
        f[(a + 28) >> 2] = i;
        f[(a + 32) >> 2] = i;
        f[(a + 36) >> 2] = i;
        f[(a + 40) >> 2] = i;
        f[(a + 44) >> 2] = i;
        f[(a + 48) >> 2] = i;
        f[(a + 52) >> 2] = i;
        f[(a + 56) >> 2] = i;
        f[(a + 60) >> 2] = i;
        a = (a + 64) | 0;
      }
      while ((a | 0) < (g | 0)) {
        f[a >> 2] = i;
        a = (a + 4) | 0;
      }
    }
    while ((a | 0) < (e | 0)) {
      b[a >> 0] = c;
      a = (a + 1) | 0;
    }
    return (e - d) | 0;
  }
  function gc(a, c, d) {
    a = a | 0;
    c = c | 0;
    d = d | 0;
    var e = 0,
      g = 0,
      h = 0;
    if ((d | 0) >= 8192) return ra(a | 0, c | 0, d | 0) | 0;
    e = a | 0;
    g = (a + d) | 0;
    if ((a & 3) == (c & 3)) {
      while (a & 3) {
        if (!d) return e | 0;
        b[a >> 0] = b[c >> 0] | 0;
        a = (a + 1) | 0;
        c = (c + 1) | 0;
        d = (d - 1) | 0;
      }
      h = (g & -4) | 0;
      d = (h - 64) | 0;
      while ((a | 0) <= (d | 0)) {
        f[a >> 2] = f[c >> 2];
        f[(a + 4) >> 2] = f[(c + 4) >> 2];
        f[(a + 8) >> 2] = f[(c + 8) >> 2];
        f[(a + 12) >> 2] = f[(c + 12) >> 2];
        f[(a + 16) >> 2] = f[(c + 16) >> 2];
        f[(a + 20) >> 2] = f[(c + 20) >> 2];
        f[(a + 24) >> 2] = f[(c + 24) >> 2];
        f[(a + 28) >> 2] = f[(c + 28) >> 2];
        f[(a + 32) >> 2] = f[(c + 32) >> 2];
        f[(a + 36) >> 2] = f[(c + 36) >> 2];
        f[(a + 40) >> 2] = f[(c + 40) >> 2];
        f[(a + 44) >> 2] = f[(c + 44) >> 2];
        f[(a + 48) >> 2] = f[(c + 48) >> 2];
        f[(a + 52) >> 2] = f[(c + 52) >> 2];
        f[(a + 56) >> 2] = f[(c + 56) >> 2];
        f[(a + 60) >> 2] = f[(c + 60) >> 2];
        a = (a + 64) | 0;
        c = (c + 64) | 0;
      }
      while ((a | 0) < (h | 0)) {
        f[a >> 2] = f[c >> 2];
        a = (a + 4) | 0;
        c = (c + 4) | 0;
      }
    } else {
      h = (g - 4) | 0;
      while ((a | 0) < (h | 0)) {
        b[a >> 0] = b[c >> 0] | 0;
        b[(a + 1) >> 0] = b[(c + 1) >> 0] | 0;
        b[(a + 2) >> 0] = b[(c + 2) >> 0] | 0;
        b[(a + 3) >> 0] = b[(c + 3) >> 0] | 0;
        a = (a + 4) | 0;
        c = (c + 4) | 0;
      }
    }
    while ((a | 0) < (g | 0)) {
      b[a >> 0] = b[c >> 0] | 0;
      a = (a + 1) | 0;
      c = (c + 1) | 0;
    }
    return e | 0;
  }
  function hc(a, b, c, d) {
    a = a | 0;
    b = b | 0;
    c = c | 0;
    d = d | 0;
    return Ba[a & 7](b | 0, c | 0, d | 0) | 0;
  }
  function ic(a, b, c, d, e, f) {
    a = a | 0;
    b = b | 0;
    c = c | 0;
    d = d | 0;
    e = e | 0;
    f = f | 0;
    Ca[a & 3](b | 0, c | 0, d | 0, e | 0, f | 0);
  }
  function jc(a, b) {
    a = a | 0;
    b = b | 0;
    Da[a & 7](b | 0);
  }
  function kc(a, b, c) {
    a = a | 0;
    b = b | 0;
    c = c | 0;
    Ea[a & 7](b | 0, c | 0);
  }
  function lc(a, b) {
    a = a | 0;
    b = b | 0;
    return Fa[a & 1](b | 0) | 0;
  }
  function mc(a) {
    a = a | 0;
    Ga[a & 1]();
  }
  function nc(a, b, c, d, e, f, g) {
    a = a | 0;
    b = b | 0;
    c = c | 0;
    d = d | 0;
    e = e | 0;
    f = f | 0;
    g = g | 0;
    Ha[a & 3](b | 0, c | 0, d | 0, e | 0, f | 0, g | 0);
  }
  function oc(a, b, c, d, e) {
    a = a | 0;
    b = b | 0;
    c = c | 0;
    d = d | 0;
    e = e | 0;
    Ia[a & 3](b | 0, c | 0, d | 0, e | 0);
  }
  function pc(a, b, c) {
    a = a | 0;
    b = b | 0;
    c = c | 0;
    _(0);
    return 0;
  }
  function qc(a, b, c, d, e) {
    a = a | 0;
    b = b | 0;
    c = c | 0;
    d = d | 0;
    e = e | 0;
    _(1);
  }
  function rc(a) {
    a = a | 0;
    _(2);
  }
  function sc(a, b) {
    a = a | 0;
    b = b | 0;
    _(3);
  }
  function tc(a) {
    a = a | 0;
    _(4);
    return 0;
  }
  function uc() {
    _(5);
  }
  function vc() {
    wa();
  }
  function wc(a, b, c, d, e, f) {
    a = a | 0;
    b = b | 0;
    c = c | 0;
    d = d | 0;
    e = e | 0;
    f = f | 0;
    _(6);
  }
  function xc(a, b, c, d) {
    a = a | 0;
    b = b | 0;
    c = c | 0;
    d = d | 0;
    _(7);
  }

  // EMSCRIPTEN_END_FUNCS
  var Ba = [pc, Fb, yb, Qb, Eb, pc, pc, pc];
  var Ca = [qc, Sb, $b, qc];
  var Da = [rc, Mb, Nb, Ob, Pb, Zb, rc, rc];
  var Ea = [sc, Va, Wa, hb, ib, kb, lb, sc];
  var Fa = [tc, xb];
  var Ga = [uc, vc];
  var Ha = [wc, Rb, _b, wc];
  var Ia = [xc, Tb, ac, xc];
  return {
    stackSave: Ka,
    setThrew: Na,
    dynCall_vii: kc,
    _fflush: Kb,
    _DecompressImage: tb,
    _memset: fc,
    _sbrk: ec,
    _memcpy: gc,
    stackAlloc: Ja,
    dynCall_vi: jc,
    getTempRet0: Pa,
    setTempRet0: Oa,
    dynCall_iiii: hc,
    stackRestore: La,
    dynCall_ii: lc,
    dynCall_viiii: oc,
    ___errno_location: Ab,
    runPostSets: dc,
    _CompressImage: sb,
    dynCall_v: mc,
    _free: vb,
    dynCall_viiiii: ic,
    dynCall_viiiiii: nc,
    establishStackSpace: Ma,
    _emscripten_get_global_libc: wb,
    _malloc: ub,
    _emscripten_replace_memory: Aa,
    _GetStorageRequirements: rb,
  };
})(
  // EMSCRIPTEN_END_ASM
  Module.asmGlobalArg,
  Module.asmLibraryArg,
  buffer
);
var _CompressImage = (Module["_CompressImage"] = asm["_CompressImage"]);
var _malloc = (Module["_malloc"] = asm["_malloc"]);
var getTempRet0 = (Module["getTempRet0"] = asm["getTempRet0"]);
var _free = (Module["_free"] = asm["_free"]);
var _DecompressImage = (Module["_DecompressImage"] = asm["_DecompressImage"]);
var setTempRet0 = (Module["setTempRet0"] = asm["setTempRet0"]);
var establishStackSpace = (Module["establishStackSpace"] =
  asm["establishStackSpace"]);
var stackRestore = (Module["stackRestore"] = asm["stackRestore"]);
var stackSave = (Module["stackSave"] = asm["stackSave"]);
var _memset = (Module["_memset"] = asm["_memset"]);
var _sbrk = (Module["_sbrk"] = asm["_sbrk"]);
var _emscripten_get_global_libc = (Module["_emscripten_get_global_libc"] =
  asm["_emscripten_get_global_libc"]);
var _memcpy = (Module["_memcpy"] = asm["_memcpy"]);
var _emscripten_replace_memory = (Module["_emscripten_replace_memory"] =
  asm["_emscripten_replace_memory"]);
var stackAlloc = (Module["stackAlloc"] = asm["stackAlloc"]);
var setThrew = (Module["setThrew"] = asm["setThrew"]);
var _fflush = (Module["_fflush"] = asm["_fflush"]);
var _GetStorageRequirements = (Module["_GetStorageRequirements"] =
  asm["_GetStorageRequirements"]);
var ___errno_location = (Module["___errno_location"] =
  asm["___errno_location"]);
var runPostSets = (Module["runPostSets"] = asm["runPostSets"]);
var dynCall_iiii = (Module["dynCall_iiii"] = asm["dynCall_iiii"]);
var dynCall_viiiii = (Module["dynCall_viiiii"] = asm["dynCall_viiiii"]);
var dynCall_vi = (Module["dynCall_vi"] = asm["dynCall_vi"]);
var dynCall_vii = (Module["dynCall_vii"] = asm["dynCall_vii"]);
var dynCall_ii = (Module["dynCall_ii"] = asm["dynCall_ii"]);
var dynCall_v = (Module["dynCall_v"] = asm["dynCall_v"]);
var dynCall_viiiiii = (Module["dynCall_viiiiii"] = asm["dynCall_viiiiii"]);
var dynCall_viiii = (Module["dynCall_viiii"] = asm["dynCall_viiii"]);
Runtime.stackAlloc = Module["stackAlloc"];
Runtime.stackSave = Module["stackSave"];
Runtime.stackRestore = Module["stackRestore"];
Runtime.establishStackSpace = Module["establishStackSpace"];
Runtime.setTempRet0 = Module["setTempRet0"];
Runtime.getTempRet0 = Module["getTempRet0"];
Module["asm"] = asm;
function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
}
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;
var initialStackTop;
var preloadStartTime = null;
var calledMain = false;
dependenciesFulfilled = function runCaller() {
  if (!Module["calledRun"]) run();
  if (!Module["calledRun"]) dependenciesFulfilled = runCaller;
};
Module["callMain"] = Module.callMain = function callMain(args) {
  args = args || [];
  ensureInitRuntime();
  var argc = args.length + 1;
  function pad() {
    for (var i = 0; i < 4 - 1; i++) {
      argv.push(0);
    }
  }
  var argv = [
    allocate(intArrayFromString(Module["thisProgram"]), "i8", ALLOC_NORMAL),
  ];
  pad();
  for (var i = 0; i < argc - 1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), "i8", ALLOC_NORMAL));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, "i32", ALLOC_NORMAL);
  try {
    var ret = Module["_main"](argc, argv, 0);
    exit(ret, true);
  } catch (e) {
    if (e instanceof ExitStatus) {
      return;
    } else if (e == "SimulateInfiniteLoop") {
      Module["noExitRuntime"] = true;
      return;
    } else {
      var toLog = e;
      if (e && typeof e === "object" && e.stack) {
        toLog = [e, e.stack];
      }
      Module.printErr("exception thrown: " + toLog);
      Module["quit"](1, e);
    }
  } finally {
    calledMain = true;
  }
};
function run(args) {
  args = args || Module["arguments"];
  if (preloadStartTime === null) preloadStartTime = Date.now();
  if (runDependencies > 0) {
    return;
  }
  preRun();
  if (runDependencies > 0) return;
  if (Module["calledRun"]) return;
  function doRun() {
    if (Module["calledRun"]) return;
    Module["calledRun"] = true;
    if (ABORT) return;
    ensureInitRuntime();
    preMain();
    if (Module["onRuntimeInitialized"]) Module["onRuntimeInitialized"]();
    if (Module["_main"] && shouldRunNow) Module["callMain"](args);
    postRun();
  }
  if (Module["setStatus"]) {
    Module["setStatus"]("Running...");
    setTimeout(function () {
      setTimeout(function () {
        Module["setStatus"]("");
      }, 1);
      doRun();
    }, 1);
  } else {
    doRun();
  }
}
Module["run"] = Module.run = run;
function exit(status, implicit) {
  if (implicit && Module["noExitRuntime"]) {
    return;
  }
  if (Module["noExitRuntime"]) {
  } else {
    ABORT = true;
    EXITSTATUS = status;
    STACKTOP = initialStackTop;
    exitRuntime();
    if (Module["onExit"]) Module["onExit"](status);
  }
  if (ENVIRONMENT_IS_NODE) {
    process["exit"](status);
  }
  Module["quit"](status, new ExitStatus(status));
}
Module["exit"] = Module.exit = exit;
var abortDecorators = [];
function abort(what) {
  if (Module["onAbort"]) {
    Module["onAbort"](what);
  }
  if (what !== undefined) {
    Module.print(what);
    Module.printErr(what);
    what = JSON.stringify(what);
  } else {
    what = "";
  }
  ABORT = true;
  EXITSTATUS = 1;
  var extra =
    "\nIf this abort() is unexpected, build with -s ASSERTIONS=1 which can give more information.";
  var output = "abort(" + what + ") at " + stackTrace() + extra;
  if (abortDecorators) {
    abortDecorators.forEach(function (decorator) {
      output = decorator(output, what);
    });
  }
  throw output;
}
Module["abort"] = Module.abort = abort;
if (Module["preInit"]) {
  if (typeof Module["preInit"] == "function")
    Module["preInit"] = [Module["preInit"]];
  while (Module["preInit"].length > 0) {
    Module["preInit"].pop()();
  }
}
var shouldRunNow = true;
if (Module["noInitialRun"]) {
  shouldRunNow = false;
}
run();
globalThis.squishJs = Module;
