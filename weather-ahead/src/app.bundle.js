(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  // node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/external.js
  var external_exports = {};
  __export(external_exports, {
    BRAND: () => BRAND,
    DIRTY: () => DIRTY,
    EMPTY_PATH: () => EMPTY_PATH,
    INVALID: () => INVALID,
    NEVER: () => NEVER,
    OK: () => OK,
    ParseStatus: () => ParseStatus,
    Schema: () => ZodType,
    ZodAny: () => ZodAny,
    ZodArray: () => ZodArray,
    ZodBigInt: () => ZodBigInt,
    ZodBoolean: () => ZodBoolean,
    ZodBranded: () => ZodBranded,
    ZodCatch: () => ZodCatch,
    ZodDate: () => ZodDate,
    ZodDefault: () => ZodDefault,
    ZodDiscriminatedUnion: () => ZodDiscriminatedUnion,
    ZodEffects: () => ZodEffects,
    ZodEnum: () => ZodEnum,
    ZodError: () => ZodError,
    ZodFirstPartyTypeKind: () => ZodFirstPartyTypeKind,
    ZodFunction: () => ZodFunction,
    ZodIntersection: () => ZodIntersection,
    ZodIssueCode: () => ZodIssueCode,
    ZodLazy: () => ZodLazy,
    ZodLiteral: () => ZodLiteral,
    ZodMap: () => ZodMap,
    ZodNaN: () => ZodNaN,
    ZodNativeEnum: () => ZodNativeEnum,
    ZodNever: () => ZodNever,
    ZodNull: () => ZodNull,
    ZodNullable: () => ZodNullable,
    ZodNumber: () => ZodNumber,
    ZodObject: () => ZodObject,
    ZodOptional: () => ZodOptional,
    ZodParsedType: () => ZodParsedType,
    ZodPipeline: () => ZodPipeline,
    ZodPromise: () => ZodPromise,
    ZodReadonly: () => ZodReadonly,
    ZodRecord: () => ZodRecord,
    ZodSchema: () => ZodType,
    ZodSet: () => ZodSet,
    ZodString: () => ZodString,
    ZodSymbol: () => ZodSymbol,
    ZodTransformer: () => ZodEffects,
    ZodTuple: () => ZodTuple,
    ZodType: () => ZodType,
    ZodUndefined: () => ZodUndefined,
    ZodUnion: () => ZodUnion,
    ZodUnknown: () => ZodUnknown,
    ZodVoid: () => ZodVoid,
    addIssueToContext: () => addIssueToContext,
    any: () => anyType,
    array: () => arrayType,
    bigint: () => bigIntType,
    boolean: () => booleanType,
    coerce: () => coerce,
    custom: () => custom,
    date: () => dateType,
    datetimeRegex: () => datetimeRegex,
    defaultErrorMap: () => en_default,
    discriminatedUnion: () => discriminatedUnionType,
    effect: () => effectsType,
    enum: () => enumType,
    function: () => functionType,
    getErrorMap: () => getErrorMap,
    getParsedType: () => getParsedType,
    instanceof: () => instanceOfType,
    intersection: () => intersectionType,
    isAborted: () => isAborted,
    isAsync: () => isAsync,
    isDirty: () => isDirty,
    isValid: () => isValid,
    late: () => late,
    lazy: () => lazyType,
    literal: () => literalType,
    makeIssue: () => makeIssue,
    map: () => mapType,
    nan: () => nanType,
    nativeEnum: () => nativeEnumType,
    never: () => neverType,
    null: () => nullType,
    nullable: () => nullableType,
    number: () => numberType,
    object: () => objectType,
    objectUtil: () => objectUtil,
    oboolean: () => oboolean,
    onumber: () => onumber,
    optional: () => optionalType,
    ostring: () => ostring,
    pipeline: () => pipelineType,
    preprocess: () => preprocessType,
    promise: () => promiseType,
    quotelessJson: () => quotelessJson,
    record: () => recordType,
    set: () => setType,
    setErrorMap: () => setErrorMap,
    strictObject: () => strictObjectType,
    string: () => stringType,
    symbol: () => symbolType,
    transformer: () => effectsType,
    tuple: () => tupleType,
    undefined: () => undefinedType,
    union: () => unionType,
    unknown: () => unknownType,
    util: () => util,
    void: () => voidType
  });

  // node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/helpers/util.js
  var util;
  (function(util2) {
    util2.assertEqual = (_) => {
    };
    function assertIs(_arg) {
    }
    util2.assertIs = assertIs;
    function assertNever(_x) {
      throw new Error();
    }
    util2.assertNever = assertNever;
    util2.arrayToEnum = (items) => {
      const obj = {};
      for (const item of items) {
        obj[item] = item;
      }
      return obj;
    };
    util2.getValidEnumValues = (obj) => {
      const validKeys = util2.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
      const filtered = {};
      for (const k of validKeys) {
        filtered[k] = obj[k];
      }
      return util2.objectValues(filtered);
    };
    util2.objectValues = (obj) => {
      return util2.objectKeys(obj).map(function(e) {
        return obj[e];
      });
    };
    util2.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
      const keys = [];
      for (const key in object) {
        if (Object.prototype.hasOwnProperty.call(object, key)) {
          keys.push(key);
        }
      }
      return keys;
    };
    util2.find = (arr, checker) => {
      for (const item of arr) {
        if (checker(item))
          return item;
      }
      return void 0;
    };
    util2.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
    function joinValues(array, separator = " | ") {
      return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
    }
    util2.joinValues = joinValues;
    util2.jsonStringifyReplacer = (_, value) => {
      if (typeof value === "bigint") {
        return value.toString();
      }
      return value;
    };
  })(util || (util = {}));
  var objectUtil;
  (function(objectUtil2) {
    objectUtil2.mergeShapes = (first, second) => {
      return {
        ...first,
        ...second
        // second overwrites first
      };
    };
  })(objectUtil || (objectUtil = {}));
  var ZodParsedType = util.arrayToEnum([
    "string",
    "nan",
    "number",
    "integer",
    "float",
    "boolean",
    "date",
    "bigint",
    "symbol",
    "function",
    "undefined",
    "null",
    "array",
    "object",
    "unknown",
    "promise",
    "void",
    "never",
    "map",
    "set"
  ]);
  var getParsedType = (data) => {
    const t2 = typeof data;
    switch (t2) {
      case "undefined":
        return ZodParsedType.undefined;
      case "string":
        return ZodParsedType.string;
      case "number":
        return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
      case "boolean":
        return ZodParsedType.boolean;
      case "function":
        return ZodParsedType.function;
      case "bigint":
        return ZodParsedType.bigint;
      case "symbol":
        return ZodParsedType.symbol;
      case "object":
        if (Array.isArray(data)) {
          return ZodParsedType.array;
        }
        if (data === null) {
          return ZodParsedType.null;
        }
        if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
          return ZodParsedType.promise;
        }
        if (typeof Map !== "undefined" && data instanceof Map) {
          return ZodParsedType.map;
        }
        if (typeof Set !== "undefined" && data instanceof Set) {
          return ZodParsedType.set;
        }
        if (typeof Date !== "undefined" && data instanceof Date) {
          return ZodParsedType.date;
        }
        return ZodParsedType.object;
      default:
        return ZodParsedType.unknown;
    }
  };

  // node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/ZodError.js
  var ZodIssueCode = util.arrayToEnum([
    "invalid_type",
    "invalid_literal",
    "custom",
    "invalid_union",
    "invalid_union_discriminator",
    "invalid_enum_value",
    "unrecognized_keys",
    "invalid_arguments",
    "invalid_return_type",
    "invalid_date",
    "invalid_string",
    "too_small",
    "too_big",
    "invalid_intersection_types",
    "not_multiple_of",
    "not_finite"
  ]);
  var quotelessJson = (obj) => {
    const json = JSON.stringify(obj, null, 2);
    return json.replace(/"([^"]+)":/g, "$1:");
  };
  var ZodError = class _ZodError extends Error {
    get errors() {
      return this.issues;
    }
    constructor(issues) {
      super();
      this.issues = [];
      this.addIssue = (sub) => {
        this.issues = [...this.issues, sub];
      };
      this.addIssues = (subs = []) => {
        this.issues = [...this.issues, ...subs];
      };
      const actualProto = new.target.prototype;
      if (Object.setPrototypeOf) {
        Object.setPrototypeOf(this, actualProto);
      } else {
        this.__proto__ = actualProto;
      }
      this.name = "ZodError";
      this.issues = issues;
    }
    format(_mapper) {
      const mapper = _mapper || function(issue) {
        return issue.message;
      };
      const fieldErrors = { _errors: [] };
      const processError = (error) => {
        for (const issue of error.issues) {
          if (issue.code === "invalid_union") {
            issue.unionErrors.map(processError);
          } else if (issue.code === "invalid_return_type") {
            processError(issue.returnTypeError);
          } else if (issue.code === "invalid_arguments") {
            processError(issue.argumentsError);
          } else if (issue.path.length === 0) {
            fieldErrors._errors.push(mapper(issue));
          } else {
            let curr = fieldErrors;
            let i = 0;
            while (i < issue.path.length) {
              const el = issue.path[i];
              const terminal = i === issue.path.length - 1;
              if (!terminal) {
                curr[el] = curr[el] || { _errors: [] };
              } else {
                curr[el] = curr[el] || { _errors: [] };
                curr[el]._errors.push(mapper(issue));
              }
              curr = curr[el];
              i++;
            }
          }
        }
      };
      processError(this);
      return fieldErrors;
    }
    static assert(value) {
      if (!(value instanceof _ZodError)) {
        throw new Error(`Not a ZodError: ${value}`);
      }
    }
    toString() {
      return this.message;
    }
    get message() {
      return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
    }
    get isEmpty() {
      return this.issues.length === 0;
    }
    flatten(mapper = (issue) => issue.message) {
      const fieldErrors = {};
      const formErrors = [];
      for (const sub of this.issues) {
        if (sub.path.length > 0) {
          const firstEl = sub.path[0];
          fieldErrors[firstEl] = fieldErrors[firstEl] || [];
          fieldErrors[firstEl].push(mapper(sub));
        } else {
          formErrors.push(mapper(sub));
        }
      }
      return { formErrors, fieldErrors };
    }
    get formErrors() {
      return this.flatten();
    }
  };
  ZodError.create = (issues) => {
    const error = new ZodError(issues);
    return error;
  };

  // node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/locales/en.js
  var errorMap = (issue, _ctx) => {
    let message;
    switch (issue.code) {
      case ZodIssueCode.invalid_type:
        if (issue.received === ZodParsedType.undefined) {
          message = "Required";
        } else {
          message = `Expected ${issue.expected}, received ${issue.received}`;
        }
        break;
      case ZodIssueCode.invalid_literal:
        message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
        break;
      case ZodIssueCode.unrecognized_keys:
        message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
        break;
      case ZodIssueCode.invalid_union:
        message = `Invalid input`;
        break;
      case ZodIssueCode.invalid_union_discriminator:
        message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
        break;
      case ZodIssueCode.invalid_enum_value:
        message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
        break;
      case ZodIssueCode.invalid_arguments:
        message = `Invalid function arguments`;
        break;
      case ZodIssueCode.invalid_return_type:
        message = `Invalid function return type`;
        break;
      case ZodIssueCode.invalid_date:
        message = `Invalid date`;
        break;
      case ZodIssueCode.invalid_string:
        if (typeof issue.validation === "object") {
          if ("includes" in issue.validation) {
            message = `Invalid input: must include "${issue.validation.includes}"`;
            if (typeof issue.validation.position === "number") {
              message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
            }
          } else if ("startsWith" in issue.validation) {
            message = `Invalid input: must start with "${issue.validation.startsWith}"`;
          } else if ("endsWith" in issue.validation) {
            message = `Invalid input: must end with "${issue.validation.endsWith}"`;
          } else {
            util.assertNever(issue.validation);
          }
        } else if (issue.validation !== "regex") {
          message = `Invalid ${issue.validation}`;
        } else {
          message = "Invalid";
        }
        break;
      case ZodIssueCode.too_small:
        if (issue.type === "array")
          message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
        else if (issue.type === "string")
          message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
        else if (issue.type === "number")
          message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
        else if (issue.type === "bigint")
          message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
        else if (issue.type === "date")
          message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
        else
          message = "Invalid input";
        break;
      case ZodIssueCode.too_big:
        if (issue.type === "array")
          message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
        else if (issue.type === "string")
          message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
        else if (issue.type === "number")
          message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
        else if (issue.type === "bigint")
          message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
        else if (issue.type === "date")
          message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
        else
          message = "Invalid input";
        break;
      case ZodIssueCode.custom:
        message = `Invalid input`;
        break;
      case ZodIssueCode.invalid_intersection_types:
        message = `Intersection results could not be merged`;
        break;
      case ZodIssueCode.not_multiple_of:
        message = `Number must be a multiple of ${issue.multipleOf}`;
        break;
      case ZodIssueCode.not_finite:
        message = "Number must be finite";
        break;
      default:
        message = _ctx.defaultError;
        util.assertNever(issue);
    }
    return { message };
  };
  var en_default = errorMap;

  // node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/errors.js
  var overrideErrorMap = en_default;
  function setErrorMap(map) {
    overrideErrorMap = map;
  }
  function getErrorMap() {
    return overrideErrorMap;
  }

  // node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/helpers/parseUtil.js
  var makeIssue = (params) => {
    const { data, path, errorMaps, issueData } = params;
    const fullPath = [...path, ...issueData.path || []];
    const fullIssue = {
      ...issueData,
      path: fullPath
    };
    if (issueData.message !== void 0) {
      return {
        ...issueData,
        path: fullPath,
        message: issueData.message
      };
    }
    let errorMessage = "";
    const maps = errorMaps.filter((m) => !!m).slice().reverse();
    for (const map of maps) {
      errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
    }
    return {
      ...issueData,
      path: fullPath,
      message: errorMessage
    };
  };
  var EMPTY_PATH = [];
  function addIssueToContext(ctx, issueData) {
    const overrideMap = getErrorMap();
    const issue = makeIssue({
      issueData,
      data: ctx.data,
      path: ctx.path,
      errorMaps: [
        ctx.common.contextualErrorMap,
        // contextual error map is first priority
        ctx.schemaErrorMap,
        // then schema-bound map if available
        overrideMap,
        // then global override map
        overrideMap === en_default ? void 0 : en_default
        // then global default map
      ].filter((x) => !!x)
    });
    ctx.common.issues.push(issue);
  }
  var ParseStatus = class _ParseStatus {
    constructor() {
      this.value = "valid";
    }
    dirty() {
      if (this.value === "valid")
        this.value = "dirty";
    }
    abort() {
      if (this.value !== "aborted")
        this.value = "aborted";
    }
    static mergeArray(status, results) {
      const arrayValue = [];
      for (const s of results) {
        if (s.status === "aborted")
          return INVALID;
        if (s.status === "dirty")
          status.dirty();
        arrayValue.push(s.value);
      }
      return { status: status.value, value: arrayValue };
    }
    static async mergeObjectAsync(status, pairs) {
      const syncPairs = [];
      for (const pair of pairs) {
        const key = await pair.key;
        const value = await pair.value;
        syncPairs.push({
          key,
          value
        });
      }
      return _ParseStatus.mergeObjectSync(status, syncPairs);
    }
    static mergeObjectSync(status, pairs) {
      const finalObject = {};
      for (const pair of pairs) {
        const { key, value } = pair;
        if (key.status === "aborted")
          return INVALID;
        if (value.status === "aborted")
          return INVALID;
        if (key.status === "dirty")
          status.dirty();
        if (value.status === "dirty")
          status.dirty();
        if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
          finalObject[key.value] = value.value;
        }
      }
      return { status: status.value, value: finalObject };
    }
  };
  var INVALID = Object.freeze({
    status: "aborted"
  });
  var DIRTY = (value) => ({ status: "dirty", value });
  var OK = (value) => ({ status: "valid", value });
  var isAborted = (x) => x.status === "aborted";
  var isDirty = (x) => x.status === "dirty";
  var isValid = (x) => x.status === "valid";
  var isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;

  // node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/helpers/errorUtil.js
  var errorUtil;
  (function(errorUtil2) {
    errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
    errorUtil2.toString = (message) => typeof message === "string" ? message : message == null ? void 0 : message.message;
  })(errorUtil || (errorUtil = {}));

  // node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/types.js
  var ParseInputLazyPath = class {
    constructor(parent, value, path, key) {
      this._cachedPath = [];
      this.parent = parent;
      this.data = value;
      this._path = path;
      this._key = key;
    }
    get path() {
      if (!this._cachedPath.length) {
        if (Array.isArray(this._key)) {
          this._cachedPath.push(...this._path, ...this._key);
        } else {
          this._cachedPath.push(...this._path, this._key);
        }
      }
      return this._cachedPath;
    }
  };
  var handleResult = (ctx, result) => {
    if (isValid(result)) {
      return { success: true, data: result.value };
    } else {
      if (!ctx.common.issues.length) {
        throw new Error("Validation failed but no issues detected.");
      }
      return {
        success: false,
        get error() {
          if (this._error)
            return this._error;
          const error = new ZodError(ctx.common.issues);
          this._error = error;
          return this._error;
        }
      };
    }
  };
  function processCreateParams(params) {
    if (!params)
      return {};
    const { errorMap: errorMap2, invalid_type_error, required_error, description } = params;
    if (errorMap2 && (invalid_type_error || required_error)) {
      throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
    }
    if (errorMap2)
      return { errorMap: errorMap2, description };
    const customMap = (iss, ctx) => {
      var _a, _b;
      const { message } = params;
      if (iss.code === "invalid_enum_value") {
        return { message: message != null ? message : ctx.defaultError };
      }
      if (typeof ctx.data === "undefined") {
        return { message: (_a = message != null ? message : required_error) != null ? _a : ctx.defaultError };
      }
      if (iss.code !== "invalid_type")
        return { message: ctx.defaultError };
      return { message: (_b = message != null ? message : invalid_type_error) != null ? _b : ctx.defaultError };
    };
    return { errorMap: customMap, description };
  }
  var ZodType = class {
    get description() {
      return this._def.description;
    }
    _getType(input) {
      return getParsedType(input.data);
    }
    _getOrReturnCtx(input, ctx) {
      return ctx || {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent
      };
    }
    _processInputParams(input) {
      return {
        status: new ParseStatus(),
        ctx: {
          common: input.parent.common,
          data: input.data,
          parsedType: getParsedType(input.data),
          schemaErrorMap: this._def.errorMap,
          path: input.path,
          parent: input.parent
        }
      };
    }
    _parseSync(input) {
      const result = this._parse(input);
      if (isAsync(result)) {
        throw new Error("Synchronous parse encountered promise.");
      }
      return result;
    }
    _parseAsync(input) {
      const result = this._parse(input);
      return Promise.resolve(result);
    }
    parse(data, params) {
      const result = this.safeParse(data, params);
      if (result.success)
        return result.data;
      throw result.error;
    }
    safeParse(data, params) {
      var _a;
      const ctx = {
        common: {
          issues: [],
          async: (_a = params == null ? void 0 : params.async) != null ? _a : false,
          contextualErrorMap: params == null ? void 0 : params.errorMap
        },
        path: (params == null ? void 0 : params.path) || [],
        schemaErrorMap: this._def.errorMap,
        parent: null,
        data,
        parsedType: getParsedType(data)
      };
      const result = this._parseSync({ data, path: ctx.path, parent: ctx });
      return handleResult(ctx, result);
    }
    "~validate"(data) {
      var _a, _b;
      const ctx = {
        common: {
          issues: [],
          async: !!this["~standard"].async
        },
        path: [],
        schemaErrorMap: this._def.errorMap,
        parent: null,
        data,
        parsedType: getParsedType(data)
      };
      if (!this["~standard"].async) {
        try {
          const result = this._parseSync({ data, path: [], parent: ctx });
          return isValid(result) ? {
            value: result.value
          } : {
            issues: ctx.common.issues
          };
        } catch (err) {
          if ((_b = (_a = err == null ? void 0 : err.message) == null ? void 0 : _a.toLowerCase()) == null ? void 0 : _b.includes("encountered")) {
            this["~standard"].async = true;
          }
          ctx.common = {
            issues: [],
            async: true
          };
        }
      }
      return this._parseAsync({ data, path: [], parent: ctx }).then((result) => isValid(result) ? {
        value: result.value
      } : {
        issues: ctx.common.issues
      });
    }
    async parseAsync(data, params) {
      const result = await this.safeParseAsync(data, params);
      if (result.success)
        return result.data;
      throw result.error;
    }
    async safeParseAsync(data, params) {
      const ctx = {
        common: {
          issues: [],
          contextualErrorMap: params == null ? void 0 : params.errorMap,
          async: true
        },
        path: (params == null ? void 0 : params.path) || [],
        schemaErrorMap: this._def.errorMap,
        parent: null,
        data,
        parsedType: getParsedType(data)
      };
      const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
      const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
      return handleResult(ctx, result);
    }
    refine(check, message) {
      const getIssueProperties = (val) => {
        if (typeof message === "string" || typeof message === "undefined") {
          return { message };
        } else if (typeof message === "function") {
          return message(val);
        } else {
          return message;
        }
      };
      return this._refinement((val, ctx) => {
        const result = check(val);
        const setError = () => ctx.addIssue({
          code: ZodIssueCode.custom,
          ...getIssueProperties(val)
        });
        if (typeof Promise !== "undefined" && result instanceof Promise) {
          return result.then((data) => {
            if (!data) {
              setError();
              return false;
            } else {
              return true;
            }
          });
        }
        if (!result) {
          setError();
          return false;
        } else {
          return true;
        }
      });
    }
    refinement(check, refinementData) {
      return this._refinement((val, ctx) => {
        if (!check(val)) {
          ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
          return false;
        } else {
          return true;
        }
      });
    }
    _refinement(refinement) {
      return new ZodEffects({
        schema: this,
        typeName: ZodFirstPartyTypeKind.ZodEffects,
        effect: { type: "refinement", refinement }
      });
    }
    superRefine(refinement) {
      return this._refinement(refinement);
    }
    constructor(def) {
      this.spa = this.safeParseAsync;
      this._def = def;
      this.parse = this.parse.bind(this);
      this.safeParse = this.safeParse.bind(this);
      this.parseAsync = this.parseAsync.bind(this);
      this.safeParseAsync = this.safeParseAsync.bind(this);
      this.spa = this.spa.bind(this);
      this.refine = this.refine.bind(this);
      this.refinement = this.refinement.bind(this);
      this.superRefine = this.superRefine.bind(this);
      this.optional = this.optional.bind(this);
      this.nullable = this.nullable.bind(this);
      this.nullish = this.nullish.bind(this);
      this.array = this.array.bind(this);
      this.promise = this.promise.bind(this);
      this.or = this.or.bind(this);
      this.and = this.and.bind(this);
      this.transform = this.transform.bind(this);
      this.brand = this.brand.bind(this);
      this.default = this.default.bind(this);
      this.catch = this.catch.bind(this);
      this.describe = this.describe.bind(this);
      this.pipe = this.pipe.bind(this);
      this.readonly = this.readonly.bind(this);
      this.isNullable = this.isNullable.bind(this);
      this.isOptional = this.isOptional.bind(this);
      this["~standard"] = {
        version: 1,
        vendor: "zod",
        validate: (data) => this["~validate"](data)
      };
    }
    optional() {
      return ZodOptional.create(this, this._def);
    }
    nullable() {
      return ZodNullable.create(this, this._def);
    }
    nullish() {
      return this.nullable().optional();
    }
    array() {
      return ZodArray.create(this);
    }
    promise() {
      return ZodPromise.create(this, this._def);
    }
    or(option) {
      return ZodUnion.create([this, option], this._def);
    }
    and(incoming) {
      return ZodIntersection.create(this, incoming, this._def);
    }
    transform(transform) {
      return new ZodEffects({
        ...processCreateParams(this._def),
        schema: this,
        typeName: ZodFirstPartyTypeKind.ZodEffects,
        effect: { type: "transform", transform }
      });
    }
    default(def) {
      const defaultValueFunc = typeof def === "function" ? def : () => def;
      return new ZodDefault({
        ...processCreateParams(this._def),
        innerType: this,
        defaultValue: defaultValueFunc,
        typeName: ZodFirstPartyTypeKind.ZodDefault
      });
    }
    brand() {
      return new ZodBranded({
        typeName: ZodFirstPartyTypeKind.ZodBranded,
        type: this,
        ...processCreateParams(this._def)
      });
    }
    catch(def) {
      const catchValueFunc = typeof def === "function" ? def : () => def;
      return new ZodCatch({
        ...processCreateParams(this._def),
        innerType: this,
        catchValue: catchValueFunc,
        typeName: ZodFirstPartyTypeKind.ZodCatch
      });
    }
    describe(description) {
      const This = this.constructor;
      return new This({
        ...this._def,
        description
      });
    }
    pipe(target) {
      return ZodPipeline.create(this, target);
    }
    readonly() {
      return ZodReadonly.create(this);
    }
    isOptional() {
      return this.safeParse(void 0).success;
    }
    isNullable() {
      return this.safeParse(null).success;
    }
  };
  var cuidRegex = /^c[^\s-]{8,}$/i;
  var cuid2Regex = /^[0-9a-z]+$/;
  var ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
  var uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
  var nanoidRegex = /^[a-z0-9_-]{21}$/i;
  var jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
  var durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
  var emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
  var _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
  var emojiRegex;
  var ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
  var ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
  var ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
  var ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
  var base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
  var base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
  var dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
  var dateRegex = new RegExp(`^${dateRegexSource}$`);
  function timeRegexSource(args) {
    let secondsRegexSource = `[0-5]\\d`;
    if (args.precision) {
      secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
    } else if (args.precision == null) {
      secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
    }
    const secondsQuantifier = args.precision ? "+" : "?";
    return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
  }
  function timeRegex(args) {
    return new RegExp(`^${timeRegexSource(args)}$`);
  }
  function datetimeRegex(args) {
    let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
    const opts = [];
    opts.push(args.local ? `Z?` : `Z`);
    if (args.offset)
      opts.push(`([+-]\\d{2}:?\\d{2})`);
    regex = `${regex}(${opts.join("|")})`;
    return new RegExp(`^${regex}$`);
  }
  function isValidIP(ip, version) {
    if ((version === "v4" || !version) && ipv4Regex.test(ip)) {
      return true;
    }
    if ((version === "v6" || !version) && ipv6Regex.test(ip)) {
      return true;
    }
    return false;
  }
  function isValidJWT(jwt, alg) {
    if (!jwtRegex.test(jwt))
      return false;
    try {
      const [header] = jwt.split(".");
      if (!header)
        return false;
      const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
      const decoded = JSON.parse(atob(base64));
      if (typeof decoded !== "object" || decoded === null)
        return false;
      if ("typ" in decoded && (decoded == null ? void 0 : decoded.typ) !== "JWT")
        return false;
      if (!decoded.alg)
        return false;
      if (alg && decoded.alg !== alg)
        return false;
      return true;
    } catch {
      return false;
    }
  }
  function isValidCidr(ip, version) {
    if ((version === "v4" || !version) && ipv4CidrRegex.test(ip)) {
      return true;
    }
    if ((version === "v6" || !version) && ipv6CidrRegex.test(ip)) {
      return true;
    }
    return false;
  }
  var ZodString = class _ZodString extends ZodType {
    _parse(input) {
      if (this._def.coerce) {
        input.data = String(input.data);
      }
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.string) {
        const ctx2 = this._getOrReturnCtx(input);
        addIssueToContext(ctx2, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.string,
          received: ctx2.parsedType
        });
        return INVALID;
      }
      const status = new ParseStatus();
      let ctx = void 0;
      for (const check of this._def.checks) {
        if (check.kind === "min") {
          if (input.data.length < check.value) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: check.value,
              type: "string",
              inclusive: true,
              exact: false,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "max") {
          if (input.data.length > check.value) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: check.value,
              type: "string",
              inclusive: true,
              exact: false,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "length") {
          const tooBig = input.data.length > check.value;
          const tooSmall = input.data.length < check.value;
          if (tooBig || tooSmall) {
            ctx = this._getOrReturnCtx(input, ctx);
            if (tooBig) {
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_big,
                maximum: check.value,
                type: "string",
                inclusive: true,
                exact: true,
                message: check.message
              });
            } else if (tooSmall) {
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_small,
                minimum: check.value,
                type: "string",
                inclusive: true,
                exact: true,
                message: check.message
              });
            }
            status.dirty();
          }
        } else if (check.kind === "email") {
          if (!emailRegex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "email",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "emoji") {
          if (!emojiRegex) {
            emojiRegex = new RegExp(_emojiRegex, "u");
          }
          if (!emojiRegex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "emoji",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "uuid") {
          if (!uuidRegex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "uuid",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "nanoid") {
          if (!nanoidRegex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "nanoid",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "cuid") {
          if (!cuidRegex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "cuid",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "cuid2") {
          if (!cuid2Regex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "cuid2",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "ulid") {
          if (!ulidRegex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "ulid",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "url") {
          try {
            new URL(input.data);
          } catch {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "url",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "regex") {
          check.regex.lastIndex = 0;
          const testResult = check.regex.test(input.data);
          if (!testResult) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "regex",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "trim") {
          input.data = input.data.trim();
        } else if (check.kind === "includes") {
          if (!input.data.includes(check.value, check.position)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.invalid_string,
              validation: { includes: check.value, position: check.position },
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "toLowerCase") {
          input.data = input.data.toLowerCase();
        } else if (check.kind === "toUpperCase") {
          input.data = input.data.toUpperCase();
        } else if (check.kind === "startsWith") {
          if (!input.data.startsWith(check.value)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.invalid_string,
              validation: { startsWith: check.value },
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "endsWith") {
          if (!input.data.endsWith(check.value)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.invalid_string,
              validation: { endsWith: check.value },
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "datetime") {
          const regex = datetimeRegex(check);
          if (!regex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.invalid_string,
              validation: "datetime",
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "date") {
          const regex = dateRegex;
          if (!regex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.invalid_string,
              validation: "date",
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "time") {
          const regex = timeRegex(check);
          if (!regex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.invalid_string,
              validation: "time",
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "duration") {
          if (!durationRegex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "duration",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "ip") {
          if (!isValidIP(input.data, check.version)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "ip",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "jwt") {
          if (!isValidJWT(input.data, check.alg)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "jwt",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "cidr") {
          if (!isValidCidr(input.data, check.version)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "cidr",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "base64") {
          if (!base64Regex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "base64",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "base64url") {
          if (!base64urlRegex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "base64url",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else {
          util.assertNever(check);
        }
      }
      return { status: status.value, value: input.data };
    }
    _regex(regex, validation, message) {
      return this.refinement((data) => regex.test(data), {
        validation,
        code: ZodIssueCode.invalid_string,
        ...errorUtil.errToObj(message)
      });
    }
    _addCheck(check) {
      return new _ZodString({
        ...this._def,
        checks: [...this._def.checks, check]
      });
    }
    email(message) {
      return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
    }
    url(message) {
      return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
    }
    emoji(message) {
      return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
    }
    uuid(message) {
      return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
    }
    nanoid(message) {
      return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
    }
    cuid(message) {
      return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
    }
    cuid2(message) {
      return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
    }
    ulid(message) {
      return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
    }
    base64(message) {
      return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
    }
    base64url(message) {
      return this._addCheck({
        kind: "base64url",
        ...errorUtil.errToObj(message)
      });
    }
    jwt(options) {
      return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options) });
    }
    ip(options) {
      return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
    }
    cidr(options) {
      return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options) });
    }
    datetime(options) {
      var _a, _b;
      if (typeof options === "string") {
        return this._addCheck({
          kind: "datetime",
          precision: null,
          offset: false,
          local: false,
          message: options
        });
      }
      return this._addCheck({
        kind: "datetime",
        precision: typeof (options == null ? void 0 : options.precision) === "undefined" ? null : options == null ? void 0 : options.precision,
        offset: (_a = options == null ? void 0 : options.offset) != null ? _a : false,
        local: (_b = options == null ? void 0 : options.local) != null ? _b : false,
        ...errorUtil.errToObj(options == null ? void 0 : options.message)
      });
    }
    date(message) {
      return this._addCheck({ kind: "date", message });
    }
    time(options) {
      if (typeof options === "string") {
        return this._addCheck({
          kind: "time",
          precision: null,
          message: options
        });
      }
      return this._addCheck({
        kind: "time",
        precision: typeof (options == null ? void 0 : options.precision) === "undefined" ? null : options == null ? void 0 : options.precision,
        ...errorUtil.errToObj(options == null ? void 0 : options.message)
      });
    }
    duration(message) {
      return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
    }
    regex(regex, message) {
      return this._addCheck({
        kind: "regex",
        regex,
        ...errorUtil.errToObj(message)
      });
    }
    includes(value, options) {
      return this._addCheck({
        kind: "includes",
        value,
        position: options == null ? void 0 : options.position,
        ...errorUtil.errToObj(options == null ? void 0 : options.message)
      });
    }
    startsWith(value, message) {
      return this._addCheck({
        kind: "startsWith",
        value,
        ...errorUtil.errToObj(message)
      });
    }
    endsWith(value, message) {
      return this._addCheck({
        kind: "endsWith",
        value,
        ...errorUtil.errToObj(message)
      });
    }
    min(minLength, message) {
      return this._addCheck({
        kind: "min",
        value: minLength,
        ...errorUtil.errToObj(message)
      });
    }
    max(maxLength, message) {
      return this._addCheck({
        kind: "max",
        value: maxLength,
        ...errorUtil.errToObj(message)
      });
    }
    length(len, message) {
      return this._addCheck({
        kind: "length",
        value: len,
        ...errorUtil.errToObj(message)
      });
    }
    /**
     * Equivalent to `.min(1)`
     */
    nonempty(message) {
      return this.min(1, errorUtil.errToObj(message));
    }
    trim() {
      return new _ZodString({
        ...this._def,
        checks: [...this._def.checks, { kind: "trim" }]
      });
    }
    toLowerCase() {
      return new _ZodString({
        ...this._def,
        checks: [...this._def.checks, { kind: "toLowerCase" }]
      });
    }
    toUpperCase() {
      return new _ZodString({
        ...this._def,
        checks: [...this._def.checks, { kind: "toUpperCase" }]
      });
    }
    get isDatetime() {
      return !!this._def.checks.find((ch) => ch.kind === "datetime");
    }
    get isDate() {
      return !!this._def.checks.find((ch) => ch.kind === "date");
    }
    get isTime() {
      return !!this._def.checks.find((ch) => ch.kind === "time");
    }
    get isDuration() {
      return !!this._def.checks.find((ch) => ch.kind === "duration");
    }
    get isEmail() {
      return !!this._def.checks.find((ch) => ch.kind === "email");
    }
    get isURL() {
      return !!this._def.checks.find((ch) => ch.kind === "url");
    }
    get isEmoji() {
      return !!this._def.checks.find((ch) => ch.kind === "emoji");
    }
    get isUUID() {
      return !!this._def.checks.find((ch) => ch.kind === "uuid");
    }
    get isNANOID() {
      return !!this._def.checks.find((ch) => ch.kind === "nanoid");
    }
    get isCUID() {
      return !!this._def.checks.find((ch) => ch.kind === "cuid");
    }
    get isCUID2() {
      return !!this._def.checks.find((ch) => ch.kind === "cuid2");
    }
    get isULID() {
      return !!this._def.checks.find((ch) => ch.kind === "ulid");
    }
    get isIP() {
      return !!this._def.checks.find((ch) => ch.kind === "ip");
    }
    get isCIDR() {
      return !!this._def.checks.find((ch) => ch.kind === "cidr");
    }
    get isBase64() {
      return !!this._def.checks.find((ch) => ch.kind === "base64");
    }
    get isBase64url() {
      return !!this._def.checks.find((ch) => ch.kind === "base64url");
    }
    get minLength() {
      let min = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "min") {
          if (min === null || ch.value > min)
            min = ch.value;
        }
      }
      return min;
    }
    get maxLength() {
      let max = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "max") {
          if (max === null || ch.value < max)
            max = ch.value;
        }
      }
      return max;
    }
  };
  ZodString.create = (params) => {
    var _a;
    return new ZodString({
      checks: [],
      typeName: ZodFirstPartyTypeKind.ZodString,
      coerce: (_a = params == null ? void 0 : params.coerce) != null ? _a : false,
      ...processCreateParams(params)
    });
  };
  function floatSafeRemainder(val, step) {
    const valDecCount = (val.toString().split(".")[1] || "").length;
    const stepDecCount = (step.toString().split(".")[1] || "").length;
    const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
    const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
    const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
    return valInt % stepInt / 10 ** decCount;
  }
  var ZodNumber = class _ZodNumber extends ZodType {
    constructor() {
      super(...arguments);
      this.min = this.gte;
      this.max = this.lte;
      this.step = this.multipleOf;
    }
    _parse(input) {
      if (this._def.coerce) {
        input.data = Number(input.data);
      }
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.number) {
        const ctx2 = this._getOrReturnCtx(input);
        addIssueToContext(ctx2, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.number,
          received: ctx2.parsedType
        });
        return INVALID;
      }
      let ctx = void 0;
      const status = new ParseStatus();
      for (const check of this._def.checks) {
        if (check.kind === "int") {
          if (!util.isInteger(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.invalid_type,
              expected: "integer",
              received: "float",
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "min") {
          const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
          if (tooSmall) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: check.value,
              type: "number",
              inclusive: check.inclusive,
              exact: false,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "max") {
          const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
          if (tooBig) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: check.value,
              type: "number",
              inclusive: check.inclusive,
              exact: false,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "multipleOf") {
          if (floatSafeRemainder(input.data, check.value) !== 0) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.not_multiple_of,
              multipleOf: check.value,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "finite") {
          if (!Number.isFinite(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.not_finite,
              message: check.message
            });
            status.dirty();
          }
        } else {
          util.assertNever(check);
        }
      }
      return { status: status.value, value: input.data };
    }
    gte(value, message) {
      return this.setLimit("min", value, true, errorUtil.toString(message));
    }
    gt(value, message) {
      return this.setLimit("min", value, false, errorUtil.toString(message));
    }
    lte(value, message) {
      return this.setLimit("max", value, true, errorUtil.toString(message));
    }
    lt(value, message) {
      return this.setLimit("max", value, false, errorUtil.toString(message));
    }
    setLimit(kind, value, inclusive, message) {
      return new _ZodNumber({
        ...this._def,
        checks: [
          ...this._def.checks,
          {
            kind,
            value,
            inclusive,
            message: errorUtil.toString(message)
          }
        ]
      });
    }
    _addCheck(check) {
      return new _ZodNumber({
        ...this._def,
        checks: [...this._def.checks, check]
      });
    }
    int(message) {
      return this._addCheck({
        kind: "int",
        message: errorUtil.toString(message)
      });
    }
    positive(message) {
      return this._addCheck({
        kind: "min",
        value: 0,
        inclusive: false,
        message: errorUtil.toString(message)
      });
    }
    negative(message) {
      return this._addCheck({
        kind: "max",
        value: 0,
        inclusive: false,
        message: errorUtil.toString(message)
      });
    }
    nonpositive(message) {
      return this._addCheck({
        kind: "max",
        value: 0,
        inclusive: true,
        message: errorUtil.toString(message)
      });
    }
    nonnegative(message) {
      return this._addCheck({
        kind: "min",
        value: 0,
        inclusive: true,
        message: errorUtil.toString(message)
      });
    }
    multipleOf(value, message) {
      return this._addCheck({
        kind: "multipleOf",
        value,
        message: errorUtil.toString(message)
      });
    }
    finite(message) {
      return this._addCheck({
        kind: "finite",
        message: errorUtil.toString(message)
      });
    }
    safe(message) {
      return this._addCheck({
        kind: "min",
        inclusive: true,
        value: Number.MIN_SAFE_INTEGER,
        message: errorUtil.toString(message)
      })._addCheck({
        kind: "max",
        inclusive: true,
        value: Number.MAX_SAFE_INTEGER,
        message: errorUtil.toString(message)
      });
    }
    get minValue() {
      let min = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "min") {
          if (min === null || ch.value > min)
            min = ch.value;
        }
      }
      return min;
    }
    get maxValue() {
      let max = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "max") {
          if (max === null || ch.value < max)
            max = ch.value;
        }
      }
      return max;
    }
    get isInt() {
      return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
    }
    get isFinite() {
      let max = null;
      let min = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
          return true;
        } else if (ch.kind === "min") {
          if (min === null || ch.value > min)
            min = ch.value;
        } else if (ch.kind === "max") {
          if (max === null || ch.value < max)
            max = ch.value;
        }
      }
      return Number.isFinite(min) && Number.isFinite(max);
    }
  };
  ZodNumber.create = (params) => {
    return new ZodNumber({
      checks: [],
      typeName: ZodFirstPartyTypeKind.ZodNumber,
      coerce: (params == null ? void 0 : params.coerce) || false,
      ...processCreateParams(params)
    });
  };
  var ZodBigInt = class _ZodBigInt extends ZodType {
    constructor() {
      super(...arguments);
      this.min = this.gte;
      this.max = this.lte;
    }
    _parse(input) {
      if (this._def.coerce) {
        try {
          input.data = BigInt(input.data);
        } catch {
          return this._getInvalidInput(input);
        }
      }
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.bigint) {
        return this._getInvalidInput(input);
      }
      let ctx = void 0;
      const status = new ParseStatus();
      for (const check of this._def.checks) {
        if (check.kind === "min") {
          const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
          if (tooSmall) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              type: "bigint",
              minimum: check.value,
              inclusive: check.inclusive,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "max") {
          const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
          if (tooBig) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              type: "bigint",
              maximum: check.value,
              inclusive: check.inclusive,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "multipleOf") {
          if (input.data % check.value !== BigInt(0)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.not_multiple_of,
              multipleOf: check.value,
              message: check.message
            });
            status.dirty();
          }
        } else {
          util.assertNever(check);
        }
      }
      return { status: status.value, value: input.data };
    }
    _getInvalidInput(input) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.bigint,
        received: ctx.parsedType
      });
      return INVALID;
    }
    gte(value, message) {
      return this.setLimit("min", value, true, errorUtil.toString(message));
    }
    gt(value, message) {
      return this.setLimit("min", value, false, errorUtil.toString(message));
    }
    lte(value, message) {
      return this.setLimit("max", value, true, errorUtil.toString(message));
    }
    lt(value, message) {
      return this.setLimit("max", value, false, errorUtil.toString(message));
    }
    setLimit(kind, value, inclusive, message) {
      return new _ZodBigInt({
        ...this._def,
        checks: [
          ...this._def.checks,
          {
            kind,
            value,
            inclusive,
            message: errorUtil.toString(message)
          }
        ]
      });
    }
    _addCheck(check) {
      return new _ZodBigInt({
        ...this._def,
        checks: [...this._def.checks, check]
      });
    }
    positive(message) {
      return this._addCheck({
        kind: "min",
        value: BigInt(0),
        inclusive: false,
        message: errorUtil.toString(message)
      });
    }
    negative(message) {
      return this._addCheck({
        kind: "max",
        value: BigInt(0),
        inclusive: false,
        message: errorUtil.toString(message)
      });
    }
    nonpositive(message) {
      return this._addCheck({
        kind: "max",
        value: BigInt(0),
        inclusive: true,
        message: errorUtil.toString(message)
      });
    }
    nonnegative(message) {
      return this._addCheck({
        kind: "min",
        value: BigInt(0),
        inclusive: true,
        message: errorUtil.toString(message)
      });
    }
    multipleOf(value, message) {
      return this._addCheck({
        kind: "multipleOf",
        value,
        message: errorUtil.toString(message)
      });
    }
    get minValue() {
      let min = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "min") {
          if (min === null || ch.value > min)
            min = ch.value;
        }
      }
      return min;
    }
    get maxValue() {
      let max = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "max") {
          if (max === null || ch.value < max)
            max = ch.value;
        }
      }
      return max;
    }
  };
  ZodBigInt.create = (params) => {
    var _a;
    return new ZodBigInt({
      checks: [],
      typeName: ZodFirstPartyTypeKind.ZodBigInt,
      coerce: (_a = params == null ? void 0 : params.coerce) != null ? _a : false,
      ...processCreateParams(params)
    });
  };
  var ZodBoolean = class extends ZodType {
    _parse(input) {
      if (this._def.coerce) {
        input.data = Boolean(input.data);
      }
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.boolean) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.boolean,
          received: ctx.parsedType
        });
        return INVALID;
      }
      return OK(input.data);
    }
  };
  ZodBoolean.create = (params) => {
    return new ZodBoolean({
      typeName: ZodFirstPartyTypeKind.ZodBoolean,
      coerce: (params == null ? void 0 : params.coerce) || false,
      ...processCreateParams(params)
    });
  };
  var ZodDate = class _ZodDate extends ZodType {
    _parse(input) {
      if (this._def.coerce) {
        input.data = new Date(input.data);
      }
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.date) {
        const ctx2 = this._getOrReturnCtx(input);
        addIssueToContext(ctx2, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.date,
          received: ctx2.parsedType
        });
        return INVALID;
      }
      if (Number.isNaN(input.data.getTime())) {
        const ctx2 = this._getOrReturnCtx(input);
        addIssueToContext(ctx2, {
          code: ZodIssueCode.invalid_date
        });
        return INVALID;
      }
      const status = new ParseStatus();
      let ctx = void 0;
      for (const check of this._def.checks) {
        if (check.kind === "min") {
          if (input.data.getTime() < check.value) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              message: check.message,
              inclusive: true,
              exact: false,
              minimum: check.value,
              type: "date"
            });
            status.dirty();
          }
        } else if (check.kind === "max") {
          if (input.data.getTime() > check.value) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              message: check.message,
              inclusive: true,
              exact: false,
              maximum: check.value,
              type: "date"
            });
            status.dirty();
          }
        } else {
          util.assertNever(check);
        }
      }
      return {
        status: status.value,
        value: new Date(input.data.getTime())
      };
    }
    _addCheck(check) {
      return new _ZodDate({
        ...this._def,
        checks: [...this._def.checks, check]
      });
    }
    min(minDate, message) {
      return this._addCheck({
        kind: "min",
        value: minDate.getTime(),
        message: errorUtil.toString(message)
      });
    }
    max(maxDate, message) {
      return this._addCheck({
        kind: "max",
        value: maxDate.getTime(),
        message: errorUtil.toString(message)
      });
    }
    get minDate() {
      let min = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "min") {
          if (min === null || ch.value > min)
            min = ch.value;
        }
      }
      return min != null ? new Date(min) : null;
    }
    get maxDate() {
      let max = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "max") {
          if (max === null || ch.value < max)
            max = ch.value;
        }
      }
      return max != null ? new Date(max) : null;
    }
  };
  ZodDate.create = (params) => {
    return new ZodDate({
      checks: [],
      coerce: (params == null ? void 0 : params.coerce) || false,
      typeName: ZodFirstPartyTypeKind.ZodDate,
      ...processCreateParams(params)
    });
  };
  var ZodSymbol = class extends ZodType {
    _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.symbol) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.symbol,
          received: ctx.parsedType
        });
        return INVALID;
      }
      return OK(input.data);
    }
  };
  ZodSymbol.create = (params) => {
    return new ZodSymbol({
      typeName: ZodFirstPartyTypeKind.ZodSymbol,
      ...processCreateParams(params)
    });
  };
  var ZodUndefined = class extends ZodType {
    _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.undefined) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.undefined,
          received: ctx.parsedType
        });
        return INVALID;
      }
      return OK(input.data);
    }
  };
  ZodUndefined.create = (params) => {
    return new ZodUndefined({
      typeName: ZodFirstPartyTypeKind.ZodUndefined,
      ...processCreateParams(params)
    });
  };
  var ZodNull = class extends ZodType {
    _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.null) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.null,
          received: ctx.parsedType
        });
        return INVALID;
      }
      return OK(input.data);
    }
  };
  ZodNull.create = (params) => {
    return new ZodNull({
      typeName: ZodFirstPartyTypeKind.ZodNull,
      ...processCreateParams(params)
    });
  };
  var ZodAny = class extends ZodType {
    constructor() {
      super(...arguments);
      this._any = true;
    }
    _parse(input) {
      return OK(input.data);
    }
  };
  ZodAny.create = (params) => {
    return new ZodAny({
      typeName: ZodFirstPartyTypeKind.ZodAny,
      ...processCreateParams(params)
    });
  };
  var ZodUnknown = class extends ZodType {
    constructor() {
      super(...arguments);
      this._unknown = true;
    }
    _parse(input) {
      return OK(input.data);
    }
  };
  ZodUnknown.create = (params) => {
    return new ZodUnknown({
      typeName: ZodFirstPartyTypeKind.ZodUnknown,
      ...processCreateParams(params)
    });
  };
  var ZodNever = class extends ZodType {
    _parse(input) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.never,
        received: ctx.parsedType
      });
      return INVALID;
    }
  };
  ZodNever.create = (params) => {
    return new ZodNever({
      typeName: ZodFirstPartyTypeKind.ZodNever,
      ...processCreateParams(params)
    });
  };
  var ZodVoid = class extends ZodType {
    _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.undefined) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.void,
          received: ctx.parsedType
        });
        return INVALID;
      }
      return OK(input.data);
    }
  };
  ZodVoid.create = (params) => {
    return new ZodVoid({
      typeName: ZodFirstPartyTypeKind.ZodVoid,
      ...processCreateParams(params)
    });
  };
  var ZodArray = class _ZodArray extends ZodType {
    _parse(input) {
      const { ctx, status } = this._processInputParams(input);
      const def = this._def;
      if (ctx.parsedType !== ZodParsedType.array) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.array,
          received: ctx.parsedType
        });
        return INVALID;
      }
      if (def.exactLength !== null) {
        const tooBig = ctx.data.length > def.exactLength.value;
        const tooSmall = ctx.data.length < def.exactLength.value;
        if (tooBig || tooSmall) {
          addIssueToContext(ctx, {
            code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
            minimum: tooSmall ? def.exactLength.value : void 0,
            maximum: tooBig ? def.exactLength.value : void 0,
            type: "array",
            inclusive: true,
            exact: true,
            message: def.exactLength.message
          });
          status.dirty();
        }
      }
      if (def.minLength !== null) {
        if (ctx.data.length < def.minLength.value) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: def.minLength.value,
            type: "array",
            inclusive: true,
            exact: false,
            message: def.minLength.message
          });
          status.dirty();
        }
      }
      if (def.maxLength !== null) {
        if (ctx.data.length > def.maxLength.value) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: def.maxLength.value,
            type: "array",
            inclusive: true,
            exact: false,
            message: def.maxLength.message
          });
          status.dirty();
        }
      }
      if (ctx.common.async) {
        return Promise.all([...ctx.data].map((item, i) => {
          return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
        })).then((result2) => {
          return ParseStatus.mergeArray(status, result2);
        });
      }
      const result = [...ctx.data].map((item, i) => {
        return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
      });
      return ParseStatus.mergeArray(status, result);
    }
    get element() {
      return this._def.type;
    }
    min(minLength, message) {
      return new _ZodArray({
        ...this._def,
        minLength: { value: minLength, message: errorUtil.toString(message) }
      });
    }
    max(maxLength, message) {
      return new _ZodArray({
        ...this._def,
        maxLength: { value: maxLength, message: errorUtil.toString(message) }
      });
    }
    length(len, message) {
      return new _ZodArray({
        ...this._def,
        exactLength: { value: len, message: errorUtil.toString(message) }
      });
    }
    nonempty(message) {
      return this.min(1, message);
    }
  };
  ZodArray.create = (schema, params) => {
    return new ZodArray({
      type: schema,
      minLength: null,
      maxLength: null,
      exactLength: null,
      typeName: ZodFirstPartyTypeKind.ZodArray,
      ...processCreateParams(params)
    });
  };
  function deepPartialify(schema) {
    if (schema instanceof ZodObject) {
      const newShape = {};
      for (const key in schema.shape) {
        const fieldSchema = schema.shape[key];
        newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
      }
      return new ZodObject({
        ...schema._def,
        shape: () => newShape
      });
    } else if (schema instanceof ZodArray) {
      return new ZodArray({
        ...schema._def,
        type: deepPartialify(schema.element)
      });
    } else if (schema instanceof ZodOptional) {
      return ZodOptional.create(deepPartialify(schema.unwrap()));
    } else if (schema instanceof ZodNullable) {
      return ZodNullable.create(deepPartialify(schema.unwrap()));
    } else if (schema instanceof ZodTuple) {
      return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
    } else {
      return schema;
    }
  }
  var ZodObject = class _ZodObject extends ZodType {
    constructor() {
      super(...arguments);
      this._cached = null;
      this.nonstrict = this.passthrough;
      this.augment = this.extend;
    }
    _getCached() {
      if (this._cached !== null)
        return this._cached;
      const shape = this._def.shape();
      const keys = util.objectKeys(shape);
      this._cached = { shape, keys };
      return this._cached;
    }
    _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.object) {
        const ctx2 = this._getOrReturnCtx(input);
        addIssueToContext(ctx2, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.object,
          received: ctx2.parsedType
        });
        return INVALID;
      }
      const { status, ctx } = this._processInputParams(input);
      const { shape, keys: shapeKeys } = this._getCached();
      const extraKeys = [];
      if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
        for (const key in ctx.data) {
          if (!shapeKeys.includes(key)) {
            extraKeys.push(key);
          }
        }
      }
      const pairs = [];
      for (const key of shapeKeys) {
        const keyValidator = shape[key];
        const value = ctx.data[key];
        pairs.push({
          key: { status: "valid", value: key },
          value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
          alwaysSet: key in ctx.data
        });
      }
      if (this._def.catchall instanceof ZodNever) {
        const unknownKeys = this._def.unknownKeys;
        if (unknownKeys === "passthrough") {
          for (const key of extraKeys) {
            pairs.push({
              key: { status: "valid", value: key },
              value: { status: "valid", value: ctx.data[key] }
            });
          }
        } else if (unknownKeys === "strict") {
          if (extraKeys.length > 0) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.unrecognized_keys,
              keys: extraKeys
            });
            status.dirty();
          }
        } else if (unknownKeys === "strip") {
        } else {
          throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
        }
      } else {
        const catchall = this._def.catchall;
        for (const key of extraKeys) {
          const value = ctx.data[key];
          pairs.push({
            key: { status: "valid", value: key },
            value: catchall._parse(
              new ParseInputLazyPath(ctx, value, ctx.path, key)
              //, ctx.child(key), value, getParsedType(value)
            ),
            alwaysSet: key in ctx.data
          });
        }
      }
      if (ctx.common.async) {
        return Promise.resolve().then(async () => {
          const syncPairs = [];
          for (const pair of pairs) {
            const key = await pair.key;
            const value = await pair.value;
            syncPairs.push({
              key,
              value,
              alwaysSet: pair.alwaysSet
            });
          }
          return syncPairs;
        }).then((syncPairs) => {
          return ParseStatus.mergeObjectSync(status, syncPairs);
        });
      } else {
        return ParseStatus.mergeObjectSync(status, pairs);
      }
    }
    get shape() {
      return this._def.shape();
    }
    strict(message) {
      errorUtil.errToObj;
      return new _ZodObject({
        ...this._def,
        unknownKeys: "strict",
        ...message !== void 0 ? {
          errorMap: (issue, ctx) => {
            var _a, _b, _c, _d;
            const defaultError = (_c = (_b = (_a = this._def).errorMap) == null ? void 0 : _b.call(_a, issue, ctx).message) != null ? _c : ctx.defaultError;
            if (issue.code === "unrecognized_keys")
              return {
                message: (_d = errorUtil.errToObj(message).message) != null ? _d : defaultError
              };
            return {
              message: defaultError
            };
          }
        } : {}
      });
    }
    strip() {
      return new _ZodObject({
        ...this._def,
        unknownKeys: "strip"
      });
    }
    passthrough() {
      return new _ZodObject({
        ...this._def,
        unknownKeys: "passthrough"
      });
    }
    // const AugmentFactory =
    //   <Def extends ZodObjectDef>(def: Def) =>
    //   <Augmentation extends ZodRawShape>(
    //     augmentation: Augmentation
    //   ): ZodObject<
    //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
    //     Def["unknownKeys"],
    //     Def["catchall"]
    //   > => {
    //     return new ZodObject({
    //       ...def,
    //       shape: () => ({
    //         ...def.shape(),
    //         ...augmentation,
    //       }),
    //     }) as any;
    //   };
    extend(augmentation) {
      return new _ZodObject({
        ...this._def,
        shape: () => ({
          ...this._def.shape(),
          ...augmentation
        })
      });
    }
    /**
     * Prior to zod@1.0.12 there was a bug in the
     * inferred type of merged objects. Please
     * upgrade if you are experiencing issues.
     */
    merge(merging) {
      const merged = new _ZodObject({
        unknownKeys: merging._def.unknownKeys,
        catchall: merging._def.catchall,
        shape: () => ({
          ...this._def.shape(),
          ...merging._def.shape()
        }),
        typeName: ZodFirstPartyTypeKind.ZodObject
      });
      return merged;
    }
    // merge<
    //   Incoming extends AnyZodObject,
    //   Augmentation extends Incoming["shape"],
    //   NewOutput extends {
    //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
    //       ? Augmentation[k]["_output"]
    //       : k extends keyof Output
    //       ? Output[k]
    //       : never;
    //   },
    //   NewInput extends {
    //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
    //       ? Augmentation[k]["_input"]
    //       : k extends keyof Input
    //       ? Input[k]
    //       : never;
    //   }
    // >(
    //   merging: Incoming
    // ): ZodObject<
    //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
    //   Incoming["_def"]["unknownKeys"],
    //   Incoming["_def"]["catchall"],
    //   NewOutput,
    //   NewInput
    // > {
    //   const merged: any = new ZodObject({
    //     unknownKeys: merging._def.unknownKeys,
    //     catchall: merging._def.catchall,
    //     shape: () =>
    //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
    //     typeName: ZodFirstPartyTypeKind.ZodObject,
    //   }) as any;
    //   return merged;
    // }
    setKey(key, schema) {
      return this.augment({ [key]: schema });
    }
    // merge<Incoming extends AnyZodObject>(
    //   merging: Incoming
    // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
    // ZodObject<
    //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
    //   Incoming["_def"]["unknownKeys"],
    //   Incoming["_def"]["catchall"]
    // > {
    //   // const mergedShape = objectUtil.mergeShapes(
    //   //   this._def.shape(),
    //   //   merging._def.shape()
    //   // );
    //   const merged: any = new ZodObject({
    //     unknownKeys: merging._def.unknownKeys,
    //     catchall: merging._def.catchall,
    //     shape: () =>
    //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
    //     typeName: ZodFirstPartyTypeKind.ZodObject,
    //   }) as any;
    //   return merged;
    // }
    catchall(index) {
      return new _ZodObject({
        ...this._def,
        catchall: index
      });
    }
    pick(mask) {
      const shape = {};
      for (const key of util.objectKeys(mask)) {
        if (mask[key] && this.shape[key]) {
          shape[key] = this.shape[key];
        }
      }
      return new _ZodObject({
        ...this._def,
        shape: () => shape
      });
    }
    omit(mask) {
      const shape = {};
      for (const key of util.objectKeys(this.shape)) {
        if (!mask[key]) {
          shape[key] = this.shape[key];
        }
      }
      return new _ZodObject({
        ...this._def,
        shape: () => shape
      });
    }
    /**
     * @deprecated
     */
    deepPartial() {
      return deepPartialify(this);
    }
    partial(mask) {
      const newShape = {};
      for (const key of util.objectKeys(this.shape)) {
        const fieldSchema = this.shape[key];
        if (mask && !mask[key]) {
          newShape[key] = fieldSchema;
        } else {
          newShape[key] = fieldSchema.optional();
        }
      }
      return new _ZodObject({
        ...this._def,
        shape: () => newShape
      });
    }
    required(mask) {
      const newShape = {};
      for (const key of util.objectKeys(this.shape)) {
        if (mask && !mask[key]) {
          newShape[key] = this.shape[key];
        } else {
          const fieldSchema = this.shape[key];
          let newField = fieldSchema;
          while (newField instanceof ZodOptional) {
            newField = newField._def.innerType;
          }
          newShape[key] = newField;
        }
      }
      return new _ZodObject({
        ...this._def,
        shape: () => newShape
      });
    }
    keyof() {
      return createZodEnum(util.objectKeys(this.shape));
    }
  };
  ZodObject.create = (shape, params) => {
    return new ZodObject({
      shape: () => shape,
      unknownKeys: "strip",
      catchall: ZodNever.create(),
      typeName: ZodFirstPartyTypeKind.ZodObject,
      ...processCreateParams(params)
    });
  };
  ZodObject.strictCreate = (shape, params) => {
    return new ZodObject({
      shape: () => shape,
      unknownKeys: "strict",
      catchall: ZodNever.create(),
      typeName: ZodFirstPartyTypeKind.ZodObject,
      ...processCreateParams(params)
    });
  };
  ZodObject.lazycreate = (shape, params) => {
    return new ZodObject({
      shape,
      unknownKeys: "strip",
      catchall: ZodNever.create(),
      typeName: ZodFirstPartyTypeKind.ZodObject,
      ...processCreateParams(params)
    });
  };
  var ZodUnion = class extends ZodType {
    _parse(input) {
      const { ctx } = this._processInputParams(input);
      const options = this._def.options;
      function handleResults(results) {
        for (const result of results) {
          if (result.result.status === "valid") {
            return result.result;
          }
        }
        for (const result of results) {
          if (result.result.status === "dirty") {
            ctx.common.issues.push(...result.ctx.common.issues);
            return result.result;
          }
        }
        const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_union,
          unionErrors
        });
        return INVALID;
      }
      if (ctx.common.async) {
        return Promise.all(options.map(async (option) => {
          const childCtx = {
            ...ctx,
            common: {
              ...ctx.common,
              issues: []
            },
            parent: null
          };
          return {
            result: await option._parseAsync({
              data: ctx.data,
              path: ctx.path,
              parent: childCtx
            }),
            ctx: childCtx
          };
        })).then(handleResults);
      } else {
        let dirty = void 0;
        const issues = [];
        for (const option of options) {
          const childCtx = {
            ...ctx,
            common: {
              ...ctx.common,
              issues: []
            },
            parent: null
          };
          const result = option._parseSync({
            data: ctx.data,
            path: ctx.path,
            parent: childCtx
          });
          if (result.status === "valid") {
            return result;
          } else if (result.status === "dirty" && !dirty) {
            dirty = { result, ctx: childCtx };
          }
          if (childCtx.common.issues.length) {
            issues.push(childCtx.common.issues);
          }
        }
        if (dirty) {
          ctx.common.issues.push(...dirty.ctx.common.issues);
          return dirty.result;
        }
        const unionErrors = issues.map((issues2) => new ZodError(issues2));
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_union,
          unionErrors
        });
        return INVALID;
      }
    }
    get options() {
      return this._def.options;
    }
  };
  ZodUnion.create = (types, params) => {
    return new ZodUnion({
      options: types,
      typeName: ZodFirstPartyTypeKind.ZodUnion,
      ...processCreateParams(params)
    });
  };
  var getDiscriminator = (type) => {
    if (type instanceof ZodLazy) {
      return getDiscriminator(type.schema);
    } else if (type instanceof ZodEffects) {
      return getDiscriminator(type.innerType());
    } else if (type instanceof ZodLiteral) {
      return [type.value];
    } else if (type instanceof ZodEnum) {
      return type.options;
    } else if (type instanceof ZodNativeEnum) {
      return util.objectValues(type.enum);
    } else if (type instanceof ZodDefault) {
      return getDiscriminator(type._def.innerType);
    } else if (type instanceof ZodUndefined) {
      return [void 0];
    } else if (type instanceof ZodNull) {
      return [null];
    } else if (type instanceof ZodOptional) {
      return [void 0, ...getDiscriminator(type.unwrap())];
    } else if (type instanceof ZodNullable) {
      return [null, ...getDiscriminator(type.unwrap())];
    } else if (type instanceof ZodBranded) {
      return getDiscriminator(type.unwrap());
    } else if (type instanceof ZodReadonly) {
      return getDiscriminator(type.unwrap());
    } else if (type instanceof ZodCatch) {
      return getDiscriminator(type._def.innerType);
    } else {
      return [];
    }
  };
  var ZodDiscriminatedUnion = class _ZodDiscriminatedUnion extends ZodType {
    _parse(input) {
      const { ctx } = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.object) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.object,
          received: ctx.parsedType
        });
        return INVALID;
      }
      const discriminator = this.discriminator;
      const discriminatorValue = ctx.data[discriminator];
      const option = this.optionsMap.get(discriminatorValue);
      if (!option) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_union_discriminator,
          options: Array.from(this.optionsMap.keys()),
          path: [discriminator]
        });
        return INVALID;
      }
      if (ctx.common.async) {
        return option._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
      } else {
        return option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
      }
    }
    get discriminator() {
      return this._def.discriminator;
    }
    get options() {
      return this._def.options;
    }
    get optionsMap() {
      return this._def.optionsMap;
    }
    /**
     * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
     * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
     * have a different value for each object in the union.
     * @param discriminator the name of the discriminator property
     * @param types an array of object schemas
     * @param params
     */
    static create(discriminator, options, params) {
      const optionsMap = /* @__PURE__ */ new Map();
      for (const type of options) {
        const discriminatorValues = getDiscriminator(type.shape[discriminator]);
        if (!discriminatorValues.length) {
          throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
        }
        for (const value of discriminatorValues) {
          if (optionsMap.has(value)) {
            throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
          }
          optionsMap.set(value, type);
        }
      }
      return new _ZodDiscriminatedUnion({
        typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
        discriminator,
        options,
        optionsMap,
        ...processCreateParams(params)
      });
    }
  };
  function mergeValues(a, b) {
    const aType = getParsedType(a);
    const bType = getParsedType(b);
    if (a === b) {
      return { valid: true, data: a };
    } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
      const bKeys = util.objectKeys(b);
      const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
      const newObj = { ...a, ...b };
      for (const key of sharedKeys) {
        const sharedValue = mergeValues(a[key], b[key]);
        if (!sharedValue.valid) {
          return { valid: false };
        }
        newObj[key] = sharedValue.data;
      }
      return { valid: true, data: newObj };
    } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
      if (a.length !== b.length) {
        return { valid: false };
      }
      const newArray = [];
      for (let index = 0; index < a.length; index++) {
        const itemA = a[index];
        const itemB = b[index];
        const sharedValue = mergeValues(itemA, itemB);
        if (!sharedValue.valid) {
          return { valid: false };
        }
        newArray.push(sharedValue.data);
      }
      return { valid: true, data: newArray };
    } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
      return { valid: true, data: a };
    } else {
      return { valid: false };
    }
  }
  var ZodIntersection = class extends ZodType {
    _parse(input) {
      const { status, ctx } = this._processInputParams(input);
      const handleParsed = (parsedLeft, parsedRight) => {
        if (isAborted(parsedLeft) || isAborted(parsedRight)) {
          return INVALID;
        }
        const merged = mergeValues(parsedLeft.value, parsedRight.value);
        if (!merged.valid) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_intersection_types
          });
          return INVALID;
        }
        if (isDirty(parsedLeft) || isDirty(parsedRight)) {
          status.dirty();
        }
        return { status: status.value, value: merged.data };
      };
      if (ctx.common.async) {
        return Promise.all([
          this._def.left._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          }),
          this._def.right._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          })
        ]).then(([left, right]) => handleParsed(left, right));
      } else {
        return handleParsed(this._def.left._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }), this._def.right._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }));
      }
    }
  };
  ZodIntersection.create = (left, right, params) => {
    return new ZodIntersection({
      left,
      right,
      typeName: ZodFirstPartyTypeKind.ZodIntersection,
      ...processCreateParams(params)
    });
  };
  var ZodTuple = class _ZodTuple extends ZodType {
    _parse(input) {
      const { status, ctx } = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.array) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.array,
          received: ctx.parsedType
        });
        return INVALID;
      }
      if (ctx.data.length < this._def.items.length) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: this._def.items.length,
          inclusive: true,
          exact: false,
          type: "array"
        });
        return INVALID;
      }
      const rest = this._def.rest;
      if (!rest && ctx.data.length > this._def.items.length) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: this._def.items.length,
          inclusive: true,
          exact: false,
          type: "array"
        });
        status.dirty();
      }
      const items = [...ctx.data].map((item, itemIndex) => {
        const schema = this._def.items[itemIndex] || this._def.rest;
        if (!schema)
          return null;
        return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
      }).filter((x) => !!x);
      if (ctx.common.async) {
        return Promise.all(items).then((results) => {
          return ParseStatus.mergeArray(status, results);
        });
      } else {
        return ParseStatus.mergeArray(status, items);
      }
    }
    get items() {
      return this._def.items;
    }
    rest(rest) {
      return new _ZodTuple({
        ...this._def,
        rest
      });
    }
  };
  ZodTuple.create = (schemas, params) => {
    if (!Array.isArray(schemas)) {
      throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
    }
    return new ZodTuple({
      items: schemas,
      typeName: ZodFirstPartyTypeKind.ZodTuple,
      rest: null,
      ...processCreateParams(params)
    });
  };
  var ZodRecord = class _ZodRecord extends ZodType {
    get keySchema() {
      return this._def.keyType;
    }
    get valueSchema() {
      return this._def.valueType;
    }
    _parse(input) {
      const { status, ctx } = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.object) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.object,
          received: ctx.parsedType
        });
        return INVALID;
      }
      const pairs = [];
      const keyType = this._def.keyType;
      const valueType = this._def.valueType;
      for (const key in ctx.data) {
        pairs.push({
          key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
          value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
          alwaysSet: key in ctx.data
        });
      }
      if (ctx.common.async) {
        return ParseStatus.mergeObjectAsync(status, pairs);
      } else {
        return ParseStatus.mergeObjectSync(status, pairs);
      }
    }
    get element() {
      return this._def.valueType;
    }
    static create(first, second, third) {
      if (second instanceof ZodType) {
        return new _ZodRecord({
          keyType: first,
          valueType: second,
          typeName: ZodFirstPartyTypeKind.ZodRecord,
          ...processCreateParams(third)
        });
      }
      return new _ZodRecord({
        keyType: ZodString.create(),
        valueType: first,
        typeName: ZodFirstPartyTypeKind.ZodRecord,
        ...processCreateParams(second)
      });
    }
  };
  var ZodMap = class extends ZodType {
    get keySchema() {
      return this._def.keyType;
    }
    get valueSchema() {
      return this._def.valueType;
    }
    _parse(input) {
      const { status, ctx } = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.map) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.map,
          received: ctx.parsedType
        });
        return INVALID;
      }
      const keyType = this._def.keyType;
      const valueType = this._def.valueType;
      const pairs = [...ctx.data.entries()].map(([key, value], index) => {
        return {
          key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
          value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
        };
      });
      if (ctx.common.async) {
        const finalMap = /* @__PURE__ */ new Map();
        return Promise.resolve().then(async () => {
          for (const pair of pairs) {
            const key = await pair.key;
            const value = await pair.value;
            if (key.status === "aborted" || value.status === "aborted") {
              return INVALID;
            }
            if (key.status === "dirty" || value.status === "dirty") {
              status.dirty();
            }
            finalMap.set(key.value, value.value);
          }
          return { status: status.value, value: finalMap };
        });
      } else {
        const finalMap = /* @__PURE__ */ new Map();
        for (const pair of pairs) {
          const key = pair.key;
          const value = pair.value;
          if (key.status === "aborted" || value.status === "aborted") {
            return INVALID;
          }
          if (key.status === "dirty" || value.status === "dirty") {
            status.dirty();
          }
          finalMap.set(key.value, value.value);
        }
        return { status: status.value, value: finalMap };
      }
    }
  };
  ZodMap.create = (keyType, valueType, params) => {
    return new ZodMap({
      valueType,
      keyType,
      typeName: ZodFirstPartyTypeKind.ZodMap,
      ...processCreateParams(params)
    });
  };
  var ZodSet = class _ZodSet extends ZodType {
    _parse(input) {
      const { status, ctx } = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.set) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.set,
          received: ctx.parsedType
        });
        return INVALID;
      }
      const def = this._def;
      if (def.minSize !== null) {
        if (ctx.data.size < def.minSize.value) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: def.minSize.value,
            type: "set",
            inclusive: true,
            exact: false,
            message: def.minSize.message
          });
          status.dirty();
        }
      }
      if (def.maxSize !== null) {
        if (ctx.data.size > def.maxSize.value) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: def.maxSize.value,
            type: "set",
            inclusive: true,
            exact: false,
            message: def.maxSize.message
          });
          status.dirty();
        }
      }
      const valueType = this._def.valueType;
      function finalizeSet(elements2) {
        const parsedSet = /* @__PURE__ */ new Set();
        for (const element of elements2) {
          if (element.status === "aborted")
            return INVALID;
          if (element.status === "dirty")
            status.dirty();
          parsedSet.add(element.value);
        }
        return { status: status.value, value: parsedSet };
      }
      const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
      if (ctx.common.async) {
        return Promise.all(elements).then((elements2) => finalizeSet(elements2));
      } else {
        return finalizeSet(elements);
      }
    }
    min(minSize, message) {
      return new _ZodSet({
        ...this._def,
        minSize: { value: minSize, message: errorUtil.toString(message) }
      });
    }
    max(maxSize, message) {
      return new _ZodSet({
        ...this._def,
        maxSize: { value: maxSize, message: errorUtil.toString(message) }
      });
    }
    size(size, message) {
      return this.min(size, message).max(size, message);
    }
    nonempty(message) {
      return this.min(1, message);
    }
  };
  ZodSet.create = (valueType, params) => {
    return new ZodSet({
      valueType,
      minSize: null,
      maxSize: null,
      typeName: ZodFirstPartyTypeKind.ZodSet,
      ...processCreateParams(params)
    });
  };
  var ZodFunction = class _ZodFunction extends ZodType {
    constructor() {
      super(...arguments);
      this.validate = this.implement;
    }
    _parse(input) {
      const { ctx } = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.function) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.function,
          received: ctx.parsedType
        });
        return INVALID;
      }
      function makeArgsIssue(args, error) {
        return makeIssue({
          data: args,
          path: ctx.path,
          errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
          issueData: {
            code: ZodIssueCode.invalid_arguments,
            argumentsError: error
          }
        });
      }
      function makeReturnsIssue(returns, error) {
        return makeIssue({
          data: returns,
          path: ctx.path,
          errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
          issueData: {
            code: ZodIssueCode.invalid_return_type,
            returnTypeError: error
          }
        });
      }
      const params = { errorMap: ctx.common.contextualErrorMap };
      const fn = ctx.data;
      if (this._def.returns instanceof ZodPromise) {
        const me = this;
        return OK(async function(...args) {
          const error = new ZodError([]);
          const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
            error.addIssue(makeArgsIssue(args, e));
            throw error;
          });
          const result = await Reflect.apply(fn, this, parsedArgs);
          const parsedReturns = await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
            error.addIssue(makeReturnsIssue(result, e));
            throw error;
          });
          return parsedReturns;
        });
      } else {
        const me = this;
        return OK(function(...args) {
          const parsedArgs = me._def.args.safeParse(args, params);
          if (!parsedArgs.success) {
            throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
          }
          const result = Reflect.apply(fn, this, parsedArgs.data);
          const parsedReturns = me._def.returns.safeParse(result, params);
          if (!parsedReturns.success) {
            throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
          }
          return parsedReturns.data;
        });
      }
    }
    parameters() {
      return this._def.args;
    }
    returnType() {
      return this._def.returns;
    }
    args(...items) {
      return new _ZodFunction({
        ...this._def,
        args: ZodTuple.create(items).rest(ZodUnknown.create())
      });
    }
    returns(returnType) {
      return new _ZodFunction({
        ...this._def,
        returns: returnType
      });
    }
    implement(func) {
      const validatedFunc = this.parse(func);
      return validatedFunc;
    }
    strictImplement(func) {
      const validatedFunc = this.parse(func);
      return validatedFunc;
    }
    static create(args, returns, params) {
      return new _ZodFunction({
        args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
        returns: returns || ZodUnknown.create(),
        typeName: ZodFirstPartyTypeKind.ZodFunction,
        ...processCreateParams(params)
      });
    }
  };
  var ZodLazy = class extends ZodType {
    get schema() {
      return this._def.getter();
    }
    _parse(input) {
      const { ctx } = this._processInputParams(input);
      const lazySchema = this._def.getter();
      return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
    }
  };
  ZodLazy.create = (getter, params) => {
    return new ZodLazy({
      getter,
      typeName: ZodFirstPartyTypeKind.ZodLazy,
      ...processCreateParams(params)
    });
  };
  var ZodLiteral = class extends ZodType {
    _parse(input) {
      if (input.data !== this._def.value) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          received: ctx.data,
          code: ZodIssueCode.invalid_literal,
          expected: this._def.value
        });
        return INVALID;
      }
      return { status: "valid", value: input.data };
    }
    get value() {
      return this._def.value;
    }
  };
  ZodLiteral.create = (value, params) => {
    return new ZodLiteral({
      value,
      typeName: ZodFirstPartyTypeKind.ZodLiteral,
      ...processCreateParams(params)
    });
  };
  function createZodEnum(values, params) {
    return new ZodEnum({
      values,
      typeName: ZodFirstPartyTypeKind.ZodEnum,
      ...processCreateParams(params)
    });
  }
  var ZodEnum = class _ZodEnum extends ZodType {
    _parse(input) {
      if (typeof input.data !== "string") {
        const ctx = this._getOrReturnCtx(input);
        const expectedValues = this._def.values;
        addIssueToContext(ctx, {
          expected: util.joinValues(expectedValues),
          received: ctx.parsedType,
          code: ZodIssueCode.invalid_type
        });
        return INVALID;
      }
      if (!this._cache) {
        this._cache = new Set(this._def.values);
      }
      if (!this._cache.has(input.data)) {
        const ctx = this._getOrReturnCtx(input);
        const expectedValues = this._def.values;
        addIssueToContext(ctx, {
          received: ctx.data,
          code: ZodIssueCode.invalid_enum_value,
          options: expectedValues
        });
        return INVALID;
      }
      return OK(input.data);
    }
    get options() {
      return this._def.values;
    }
    get enum() {
      const enumValues = {};
      for (const val of this._def.values) {
        enumValues[val] = val;
      }
      return enumValues;
    }
    get Values() {
      const enumValues = {};
      for (const val of this._def.values) {
        enumValues[val] = val;
      }
      return enumValues;
    }
    get Enum() {
      const enumValues = {};
      for (const val of this._def.values) {
        enumValues[val] = val;
      }
      return enumValues;
    }
    extract(values, newDef = this._def) {
      return _ZodEnum.create(values, {
        ...this._def,
        ...newDef
      });
    }
    exclude(values, newDef = this._def) {
      return _ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
        ...this._def,
        ...newDef
      });
    }
  };
  ZodEnum.create = createZodEnum;
  var ZodNativeEnum = class extends ZodType {
    _parse(input) {
      const nativeEnumValues = util.getValidEnumValues(this._def.values);
      const ctx = this._getOrReturnCtx(input);
      if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
        const expectedValues = util.objectValues(nativeEnumValues);
        addIssueToContext(ctx, {
          expected: util.joinValues(expectedValues),
          received: ctx.parsedType,
          code: ZodIssueCode.invalid_type
        });
        return INVALID;
      }
      if (!this._cache) {
        this._cache = new Set(util.getValidEnumValues(this._def.values));
      }
      if (!this._cache.has(input.data)) {
        const expectedValues = util.objectValues(nativeEnumValues);
        addIssueToContext(ctx, {
          received: ctx.data,
          code: ZodIssueCode.invalid_enum_value,
          options: expectedValues
        });
        return INVALID;
      }
      return OK(input.data);
    }
    get enum() {
      return this._def.values;
    }
  };
  ZodNativeEnum.create = (values, params) => {
    return new ZodNativeEnum({
      values,
      typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
      ...processCreateParams(params)
    });
  };
  var ZodPromise = class extends ZodType {
    unwrap() {
      return this._def.type;
    }
    _parse(input) {
      const { ctx } = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.promise,
          received: ctx.parsedType
        });
        return INVALID;
      }
      const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
      return OK(promisified.then((data) => {
        return this._def.type.parseAsync(data, {
          path: ctx.path,
          errorMap: ctx.common.contextualErrorMap
        });
      }));
    }
  };
  ZodPromise.create = (schema, params) => {
    return new ZodPromise({
      type: schema,
      typeName: ZodFirstPartyTypeKind.ZodPromise,
      ...processCreateParams(params)
    });
  };
  var ZodEffects = class extends ZodType {
    innerType() {
      return this._def.schema;
    }
    sourceType() {
      return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
    }
    _parse(input) {
      const { status, ctx } = this._processInputParams(input);
      const effect = this._def.effect || null;
      const checkCtx = {
        addIssue: (arg) => {
          addIssueToContext(ctx, arg);
          if (arg.fatal) {
            status.abort();
          } else {
            status.dirty();
          }
        },
        get path() {
          return ctx.path;
        }
      };
      checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
      if (effect.type === "preprocess") {
        const processed = effect.transform(ctx.data, checkCtx);
        if (ctx.common.async) {
          return Promise.resolve(processed).then(async (processed2) => {
            if (status.value === "aborted")
              return INVALID;
            const result = await this._def.schema._parseAsync({
              data: processed2,
              path: ctx.path,
              parent: ctx
            });
            if (result.status === "aborted")
              return INVALID;
            if (result.status === "dirty")
              return DIRTY(result.value);
            if (status.value === "dirty")
              return DIRTY(result.value);
            return result;
          });
        } else {
          if (status.value === "aborted")
            return INVALID;
          const result = this._def.schema._parseSync({
            data: processed,
            path: ctx.path,
            parent: ctx
          });
          if (result.status === "aborted")
            return INVALID;
          if (result.status === "dirty")
            return DIRTY(result.value);
          if (status.value === "dirty")
            return DIRTY(result.value);
          return result;
        }
      }
      if (effect.type === "refinement") {
        const executeRefinement = (acc) => {
          const result = effect.refinement(acc, checkCtx);
          if (ctx.common.async) {
            return Promise.resolve(result);
          }
          if (result instanceof Promise) {
            throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
          }
          return acc;
        };
        if (ctx.common.async === false) {
          const inner = this._def.schema._parseSync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          });
          if (inner.status === "aborted")
            return INVALID;
          if (inner.status === "dirty")
            status.dirty();
          executeRefinement(inner.value);
          return { status: status.value, value: inner.value };
        } else {
          return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
            if (inner.status === "aborted")
              return INVALID;
            if (inner.status === "dirty")
              status.dirty();
            return executeRefinement(inner.value).then(() => {
              return { status: status.value, value: inner.value };
            });
          });
        }
      }
      if (effect.type === "transform") {
        if (ctx.common.async === false) {
          const base = this._def.schema._parseSync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          });
          if (!isValid(base))
            return INVALID;
          const result = effect.transform(base.value, checkCtx);
          if (result instanceof Promise) {
            throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
          }
          return { status: status.value, value: result };
        } else {
          return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
            if (!isValid(base))
              return INVALID;
            return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
              status: status.value,
              value: result
            }));
          });
        }
      }
      util.assertNever(effect);
    }
  };
  ZodEffects.create = (schema, effect, params) => {
    return new ZodEffects({
      schema,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect,
      ...processCreateParams(params)
    });
  };
  ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
    return new ZodEffects({
      schema,
      effect: { type: "preprocess", transform: preprocess },
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      ...processCreateParams(params)
    });
  };
  var ZodOptional = class extends ZodType {
    _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType === ZodParsedType.undefined) {
        return OK(void 0);
      }
      return this._def.innerType._parse(input);
    }
    unwrap() {
      return this._def.innerType;
    }
  };
  ZodOptional.create = (type, params) => {
    return new ZodOptional({
      innerType: type,
      typeName: ZodFirstPartyTypeKind.ZodOptional,
      ...processCreateParams(params)
    });
  };
  var ZodNullable = class extends ZodType {
    _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType === ZodParsedType.null) {
        return OK(null);
      }
      return this._def.innerType._parse(input);
    }
    unwrap() {
      return this._def.innerType;
    }
  };
  ZodNullable.create = (type, params) => {
    return new ZodNullable({
      innerType: type,
      typeName: ZodFirstPartyTypeKind.ZodNullable,
      ...processCreateParams(params)
    });
  };
  var ZodDefault = class extends ZodType {
    _parse(input) {
      const { ctx } = this._processInputParams(input);
      let data = ctx.data;
      if (ctx.parsedType === ZodParsedType.undefined) {
        data = this._def.defaultValue();
      }
      return this._def.innerType._parse({
        data,
        path: ctx.path,
        parent: ctx
      });
    }
    removeDefault() {
      return this._def.innerType;
    }
  };
  ZodDefault.create = (type, params) => {
    return new ZodDefault({
      innerType: type,
      typeName: ZodFirstPartyTypeKind.ZodDefault,
      defaultValue: typeof params.default === "function" ? params.default : () => params.default,
      ...processCreateParams(params)
    });
  };
  var ZodCatch = class extends ZodType {
    _parse(input) {
      const { ctx } = this._processInputParams(input);
      const newCtx = {
        ...ctx,
        common: {
          ...ctx.common,
          issues: []
        }
      };
      const result = this._def.innerType._parse({
        data: newCtx.data,
        path: newCtx.path,
        parent: {
          ...newCtx
        }
      });
      if (isAsync(result)) {
        return result.then((result2) => {
          return {
            status: "valid",
            value: result2.status === "valid" ? result2.value : this._def.catchValue({
              get error() {
                return new ZodError(newCtx.common.issues);
              },
              input: newCtx.data
            })
          };
        });
      } else {
        return {
          status: "valid",
          value: result.status === "valid" ? result.value : this._def.catchValue({
            get error() {
              return new ZodError(newCtx.common.issues);
            },
            input: newCtx.data
          })
        };
      }
    }
    removeCatch() {
      return this._def.innerType;
    }
  };
  ZodCatch.create = (type, params) => {
    return new ZodCatch({
      innerType: type,
      typeName: ZodFirstPartyTypeKind.ZodCatch,
      catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
      ...processCreateParams(params)
    });
  };
  var ZodNaN = class extends ZodType {
    _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.nan) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.nan,
          received: ctx.parsedType
        });
        return INVALID;
      }
      return { status: "valid", value: input.data };
    }
  };
  ZodNaN.create = (params) => {
    return new ZodNaN({
      typeName: ZodFirstPartyTypeKind.ZodNaN,
      ...processCreateParams(params)
    });
  };
  var BRAND = /* @__PURE__ */ Symbol("zod_brand");
  var ZodBranded = class extends ZodType {
    _parse(input) {
      const { ctx } = this._processInputParams(input);
      const data = ctx.data;
      return this._def.type._parse({
        data,
        path: ctx.path,
        parent: ctx
      });
    }
    unwrap() {
      return this._def.type;
    }
  };
  var ZodPipeline = class _ZodPipeline extends ZodType {
    _parse(input) {
      const { status, ctx } = this._processInputParams(input);
      if (ctx.common.async) {
        const handleAsync = async () => {
          const inResult = await this._def.in._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          });
          if (inResult.status === "aborted")
            return INVALID;
          if (inResult.status === "dirty") {
            status.dirty();
            return DIRTY(inResult.value);
          } else {
            return this._def.out._parseAsync({
              data: inResult.value,
              path: ctx.path,
              parent: ctx
            });
          }
        };
        return handleAsync();
      } else {
        const inResult = this._def.in._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inResult.status === "aborted")
          return INVALID;
        if (inResult.status === "dirty") {
          status.dirty();
          return {
            status: "dirty",
            value: inResult.value
          };
        } else {
          return this._def.out._parseSync({
            data: inResult.value,
            path: ctx.path,
            parent: ctx
          });
        }
      }
    }
    static create(a, b) {
      return new _ZodPipeline({
        in: a,
        out: b,
        typeName: ZodFirstPartyTypeKind.ZodPipeline
      });
    }
  };
  var ZodReadonly = class extends ZodType {
    _parse(input) {
      const result = this._def.innerType._parse(input);
      const freeze = (data) => {
        if (isValid(data)) {
          data.value = Object.freeze(data.value);
        }
        return data;
      };
      return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
    }
    unwrap() {
      return this._def.innerType;
    }
  };
  ZodReadonly.create = (type, params) => {
    return new ZodReadonly({
      innerType: type,
      typeName: ZodFirstPartyTypeKind.ZodReadonly,
      ...processCreateParams(params)
    });
  };
  function cleanParams(params, data) {
    const p = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
    const p2 = typeof p === "string" ? { message: p } : p;
    return p2;
  }
  function custom(check, _params = {}, fatal) {
    if (check)
      return ZodAny.create().superRefine((data, ctx) => {
        var _a, _b;
        const r = check(data);
        if (r instanceof Promise) {
          return r.then((r2) => {
            var _a2, _b2;
            if (!r2) {
              const params = cleanParams(_params, data);
              const _fatal = (_b2 = (_a2 = params.fatal) != null ? _a2 : fatal) != null ? _b2 : true;
              ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
            }
          });
        }
        if (!r) {
          const params = cleanParams(_params, data);
          const _fatal = (_b = (_a = params.fatal) != null ? _a : fatal) != null ? _b : true;
          ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
        }
        return;
      });
    return ZodAny.create();
  }
  var late = {
    object: ZodObject.lazycreate
  };
  var ZodFirstPartyTypeKind;
  (function(ZodFirstPartyTypeKind2) {
    ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
    ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
    ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
    ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
    ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
    ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
    ZodFirstPartyTypeKind2["ZodSymbol"] = "ZodSymbol";
    ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
    ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
    ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
    ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
    ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
    ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
    ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
    ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
    ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
    ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
    ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
    ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
    ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
    ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
    ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
    ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
    ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
    ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
    ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
    ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
    ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
    ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
    ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
    ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
    ZodFirstPartyTypeKind2["ZodCatch"] = "ZodCatch";
    ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
    ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
    ZodFirstPartyTypeKind2["ZodPipeline"] = "ZodPipeline";
    ZodFirstPartyTypeKind2["ZodReadonly"] = "ZodReadonly";
  })(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
  var instanceOfType = (cls, params = {
    message: `Input not instance of ${cls.name}`
  }) => custom((data) => data instanceof cls, params);
  var stringType = ZodString.create;
  var numberType = ZodNumber.create;
  var nanType = ZodNaN.create;
  var bigIntType = ZodBigInt.create;
  var booleanType = ZodBoolean.create;
  var dateType = ZodDate.create;
  var symbolType = ZodSymbol.create;
  var undefinedType = ZodUndefined.create;
  var nullType = ZodNull.create;
  var anyType = ZodAny.create;
  var unknownType = ZodUnknown.create;
  var neverType = ZodNever.create;
  var voidType = ZodVoid.create;
  var arrayType = ZodArray.create;
  var objectType = ZodObject.create;
  var strictObjectType = ZodObject.strictCreate;
  var unionType = ZodUnion.create;
  var discriminatedUnionType = ZodDiscriminatedUnion.create;
  var intersectionType = ZodIntersection.create;
  var tupleType = ZodTuple.create;
  var recordType = ZodRecord.create;
  var mapType = ZodMap.create;
  var setType = ZodSet.create;
  var functionType = ZodFunction.create;
  var lazyType = ZodLazy.create;
  var literalType = ZodLiteral.create;
  var enumType = ZodEnum.create;
  var nativeEnumType = ZodNativeEnum.create;
  var promiseType = ZodPromise.create;
  var effectsType = ZodEffects.create;
  var optionalType = ZodOptional.create;
  var nullableType = ZodNullable.create;
  var preprocessType = ZodEffects.createWithPreprocess;
  var pipelineType = ZodPipeline.create;
  var ostring = () => stringType().optional();
  var onumber = () => numberType().optional();
  var oboolean = () => booleanType().optional();
  var coerce = {
    string: ((arg) => ZodString.create({ ...arg, coerce: true })),
    number: ((arg) => ZodNumber.create({ ...arg, coerce: true })),
    boolean: ((arg) => ZodBoolean.create({
      ...arg,
      coerce: true
    })),
    bigint: ((arg) => ZodBigInt.create({ ...arg, coerce: true })),
    date: ((arg) => ZodDate.create({ ...arg, coerce: true }))
  };
  var NEVER = INVALID;

  // node_modules/.pnpm/i99dash@file+..+..+..+..+..+..+tmp+sdk-pack+i99dash-2.0.0.tgz_zod@3.25.76/node_modules/i99dash/dist/chunk-GZBKL5NT.js
  var MiniAppContextSchema = external_exports.object({
    /// Opaque stable identifier for the signed-in user. Empty string
    /// when no account is bound. Treat as non-public.
    userId: external_exports.string(),
    /// VIN of the active car. Empty string when unbound. Sensitive —
    /// don't render in plain text or log to third parties.
    activeCarId: external_exports.string(),
    /// Host UI locale. Drives text direction + localised strings.
    locale: external_exports.enum(["ar", "en"]),
    /// Host theme brightness; use to sync your CSS color-scheme.
    isDark: external_exports.boolean(),
    /// Manifest `version` the host launched you with; echoed so you can
    /// sanity-check cache-busting behaviour.
    appVersion: external_exports.string(),
    /// Manifest `id` the host launched you with; echoed for debugging.
    appId: external_exports.string()
  });
  var ApiMethodSchema = external_exports.enum(["GET"]);
  var CallApiRequestSchema = external_exports.object({
    /// Server-relative path. Must start with `/` and match one of the
    /// host's allow-listed prefixes — the host rejects everything else
    /// without touching the backend.
    path: external_exports.string().startsWith("/", "path must start with /"),
    method: ApiMethodSchema,
    /// Optional query parameters. Values are serialised by the host's
    /// `ApiClient`, so any JSON-serialisable scalar is fine; nested
    /// objects are flattened with bracket notation.
    query: external_exports.record(external_exports.string(), external_exports.unknown()).optional()
  });
  var CallApiResponseSchema = external_exports.union([
    external_exports.object({ success: external_exports.literal(true), data: external_exports.unknown() }),
    external_exports.object({
      success: external_exports.literal(false),
      error: external_exports.object({ code: external_exports.string(), message: external_exports.string() })
    })
  ]);
  var VEHICLE_CAPABILITIES = [
    // 0–4: read surfaces — every car has these unless the OS layer is
    //      degraded (dev runner, web preview).
    "display.read",
    "pkg.read",
    // 5–9: launch surfaces — what `pkg.launch({role})` can actually
    //      reach on this trim. `cluster.icons` covers L5's "MCU mux only"
    //      reality (no pixel control, but icon-state toggles work).
    "pkg.launch.ivi",
    "pkg.launch.passenger",
    "pkg.launch.cluster.pixel",
    "pkg.launch.cluster.icons",
    "pkg.launch.dishare",
    // 7–9: surface render targets — independent of launch because a
    //      mini-app can render its own WebView surface without touching
    //      pkg.* (the dash-wallpaper case).
    "surface.write.ivi",
    "surface.write.passenger",
    "surface.write.cluster",
    // 10–11: gesture / cursor synthesis — privileged because they touch
    //        the a11y bridge.
    "cursor.write",
    "gesture.dispatch",
    // 12–15: car control — read vs set are separate so a "fan-speed
    //        gauge" mini-app can declare `ac.get` without scaring the
    //        catalog filter into asking for write perms.
    "ac.get",
    "ac.set",
    "door.set",
    "window.set"
  ];
  var CAPABILITY_BITS = Object.freeze(
    Object.fromEntries(VEHICLE_CAPABILITIES.map((cap, i) => [cap, i]))
  );
  var VehicleCapabilityEnum = external_exports.enum(
    VEHICLE_CAPABILITIES
  );
  var DILINK_FAMILIES = ["di5.0", "di5.1", "unknown"];
  var SUB_TRIMS = [
    // L5 family (Di5.0).
    "flagship",
    "navigator",
    "ultra",
    "lidar",
    // Single-trim fallback for variants with no real sub-trim split.
    "base"
  ];
  var ProfileKeySchema = external_exports.object({
    dilinkFamily: external_exports.enum(DILINK_FAMILIES),
    variantId: external_exports.string().max(64).default(""),
    /// Hardware sub-trim wire string. Validated against [SUB_TRIMS]
    /// or the empty string (trim-level aggregate slot). Closed enum
    /// keeps typos from entering the persistent table.
    subTrim: external_exports.string().max(32).refine(
      (v) => v === "" || SUB_TRIMS.includes(v),
      (v) => ({ message: `unknown subTrim ${v}` })
    ).default(""),
    /// `ro.build.fingerprint` exactly as Android reports it. Opaque
    /// to the SDK; the backend uses it as the most-precise cache
    /// key. Empty when reading an aggregate slot.
    fingerprint: external_exports.string().max(256).default("")
  }).strict();
  var VehicleCapabilitiesSnapshotSchema = external_exports.object({
    dilinkFamily: external_exports.enum(DILINK_FAMILIES),
    variantId: external_exports.string().max(64),
    subTrim: external_exports.string().max(32),
    fingerprint: external_exports.string().max(256),
    capabilities: external_exports.array(VehicleCapabilityEnum),
    capabilityBits: external_exports.number().int().nonnegative(),
    /// ISO-8601 timestamp the backend last updated this row.
    updatedAt: external_exports.string().datetime(),
    /// Probe count this row aggregates. Higher = more confident.
    /// Hosts use this only for telemetry; the union semantic is
    /// independent of count.
    probeCount: external_exports.number().int().nonnegative(),
    /// True when the resolver couldn't find a precise (fingerprint-
    /// level) match. The catalog UI can render a soft "best-effort"
    /// hint without changing functional behaviour.
    isFallback: external_exports.boolean().default(false),
    /// Why the resolver fell back, or null on a precise hit. See the
    /// schema docstring for the closed reason set.
    fallbackReason: external_exports.enum(["unknown_fingerprint", "unknown_sub_trim", "unknown_variant", "unknown_dilink"]).nullable().default(null)
  }).strict();
  var VehicleCapabilityProbeReportSchema = external_exports.object({
    profileKey: ProfileKeySchema,
    confirmed: external_exports.array(VehicleCapabilityEnum),
    /// Anonymised probe-version string so the backend can ignore
    /// reports from probe versions known to false-negative.
    probeVersion: external_exports.string().min(1).max(32)
  }).strict();
  var category_slugs_default = [
    "navigation",
    "media",
    "vehicle",
    "productivity",
    "communication",
    "entertainment",
    "services",
    "lifestyle",
    "developer",
    "other"
  ];
  var LocaleMapSchema = external_exports.record(
    external_exports.string().regex(/^[a-z]{2}$/, "locale key must be 2 lowercase letters"),
    external_exports.string().min(1, "locale value cannot be empty")
  ).refine((m) => Object.keys(m).length > 0, "at least one locale required");
  var assetPath = (extPattern, label) => external_exports.string().min(3).max(256).regex(/^\.\//, `${label} must be a relative path starting with "./"`).refine((p) => !p.split("/").includes(".."), `${label} must not traverse parent directories`).refine((p) => extPattern.test(p), `${label} extension must be one of ${extPattern.source}`);
  var ICON_EXT = /\.(png|svg)$/i;
  var PHOTO_EXT = /\.(png|jpe?g|webp|svg)$/i;
  var MiniAppManifestSchema = external_exports.object({
    /// URL-safe, globally unique identifier. Also lives in pinned
    /// home-screen shortcut deep links (`.../m/<id>`), so rotating this
    /// orphans every user's pinned icon — bump `version` instead.
    id: external_exports.string().min(2).max(64).regex(
      /^[a-z0-9][a-z0-9_-]{1,63}$/,
      "lowercase alphanumeric, _ or -, must not start with separator"
    ),
    /// Required; at least one locale. Host renders a tile title from this.
    name: LocaleMapSchema,
    /// Optional per-row copy. Same fallback semantics as `name`.
    description: LocaleMapSchema.optional(),
    /// Bundle-relative path to the tile icon. The publish service rewrites
    /// this to an absolute CDN URL at submit time; the catalog API and the
    /// Flutter host see only the rewritten URL string in this field. PNG
    /// or SVG, 256×256, ≤ 100 KB.
    icon: assetPath(ICON_EXT, "icon"),
    /// Optional 16:9 cover image rendered on app-detail surfaces. Same
    /// relative-path rules as `icon`. PNG / JPEG / WebP / SVG, 1280×720,
    /// ≤ 500 KB.
    coverImage: assetPath(PHOTO_EXT, "coverImage").optional(),
    /// Optional gallery (≤ 8). PNG / JPEG / WebP / SVG, ≤ 1920×1080,
    /// ≤ 800 KB each. Same relative-path + rewrite-at-submit semantics
    /// as `icon`.
    screenshots: external_exports.array(assetPath(PHOTO_EXT, "screenshots[]")).max(8).optional(),
    /// HTTPS URL the host's WebView opens. Must live under an allow-listed
    /// origin (`miniapps.i99dash.app` in v1). The host enforces this at
    /// launch; a manifest pointing off-allowlist is rejected.
    url: external_exports.string().url().startsWith("https://", "url must be https"),
    /// Opaque version string (semver-shaped by convention). Bumped per
    /// release to bust the WebView cache.
    version: external_exports.string().min(1),
    /// Minimum host app version. Hosts below this show an "update your
    /// app" card instead of opening the viewer. Omit for "any".
    minHostVersion: external_exports.string().optional(),
    /// Catalog category. Closed enum — see `CATEGORY_SLUGS` for the
    /// canonical list. Adding a category is a SDK + backend lockstep PR
    /// (the JSON file is vendored into backend-i99dash; CI fails on drift).
    category: external_exports.enum(category_slugs_default),
    /// Optional free-form tags. Used for search/filter only — not the
    /// primary navigation surface (categories are). Lowercase
    /// alphanumerics + hyphens, ≤ 24 chars each, ≤ 8 tags.
    tags: external_exports.array(
      external_exports.string().min(1).max(24).regex(/^[a-z0-9-]+$/, "tag must be lowercase alphanumeric or hyphen")
    ).max(8).optional(),
    /// Whether this app may render while the car is moving (speed > 5 km/h).
    /// Default `false` — catalog authors must explicitly opt in. Set only
    /// if the app is read-only, glanceable, no text input / video /
    /// interactive map.
    safeWhileDriving: external_exports.boolean().default(false),
    /// Phase G — privilege-tier opt-in. List of `cmdExec.*` permission
    /// ids the bundle needs at runtime. Empty (default) = unprivileged
    /// publish. The SDK CLI checks this list against the developer's
    /// granted perms BEFORE upload-url is minted, so a missing perm
    /// surfaces as a fast-fail with "request these first" instead of
    /// at runtime when the device blocks the action. The backend's
    /// `MiniAppService.submit` re-validates server-side as defence in
    /// depth.
    requiredPermissions: external_exports.array(external_exports.string().min(1).max(64)).default([]),
    /// Family read-only namespaces the bundle calls (``media.read``,
    /// ``vehicle.environment``, …). The host gates every family bridge
    /// call on this list — a missing entry returns ``permission_denied``
    /// from the host. Distinct from ``requiredPermissions`` because
    /// family reads have no per-developer grant requirement; any signed
    /// publisher can declare them.
    ///
    /// Validated against the host's known-family set on submit; an
    /// unknown name fails the publish.
    permissions: external_exports.array(
      external_exports.enum([
        "car.status.read",
        "climate.read",
        "connectivity.read",
        "location.read",
        "media.read",
        "nav.read",
        "system.read",
        "vehicle.diagnostics",
        "vehicle.environment"
      ])
    ).default([]),
    /// Vehicle / hardware capabilities the bundle needs to function. The
    /// host's catalog merge dims rows where the active car doesn't
    /// expose every entry here (subset check). Distinct from
    /// `permissions` (host family gating) and `requiredPermissions`
    /// (publisher-grant gating); see `vehicle-capabilities.ts` for the
    /// three-way split.
    ///
    /// Closed enum — additions require a coordinated SDK + host +
    /// backend bump (CI drift check enforces it). Empty default keeps
    /// existing manifests valid: a row that declares nothing here is
    /// treated as "runs anywhere" and only filtered by the `permissions`
    /// / `requiredPermissions` gates.
    requiredCapabilities: external_exports.array(external_exports.enum(VEHICLE_CAPABILITIES)).default([])
  });
  var CarStatusStalenessSchema = external_exports.enum(["fresh", "stale", "very_stale"]);
  var CarDoorStateSchema = external_exports.enum(["open", "closed"]);
  var CarDoorsSchema = external_exports.object({
    driver: CarDoorStateSchema.optional(),
    passenger: CarDoorStateSchema.optional(),
    rearLeft: CarDoorStateSchema.optional(),
    rearRight: CarDoorStateSchema.optional()
  }).strict();
  var CarStatusSchema = external_exports.object({
    vin: external_exports.string().min(1),
    /// ISO-8601 UTC, ``Z`` suffix.
    at: external_exports.string(),
    staleness: CarStatusStalenessSchema,
    isMoving: external_exports.boolean().optional(),
    speedKmh: external_exports.number().min(0).optional(),
    doorsLocked: external_exports.boolean().optional(),
    doors: CarDoorsSchema.optional(),
    batteryPct: external_exports.number().min(0).max(100).optional(),
    charging: external_exports.boolean().optional(),
    acOn: external_exports.boolean().optional()
  }).strict();
  var CarConnectionStateSchema = external_exports.enum(["connected", "disconnected"]);
  var HostCapabilitiesSchema = external_exports.object({
    /// Semver-ish string the host pins itself to. Opaque to the SDK —
    /// only the SDK's `client.bridgeVersion()` consumer (e.g. a
    /// crash-reporter) reads it.
    bridgeVersion: external_exports.string().min(1),
    /// Permission scope identifiers the host has handlers for. The
    /// well-known set today is `['car.status']`; new families
    /// (e.g. `media.read`) append themselves here as they ship.
    families: external_exports.array(external_exports.string().min(1))
  }).strict();
  var MediaSourceSchema = external_exports.enum([
    /// Bluetooth-connected phone (the common case).
    "bluetooth",
    /// USB stick / wired iPhone-style source.
    "usb",
    /// Aux line-in.
    "aux",
    /// Built-in radio (FM/AM/DAB depending on region).
    "radio",
    /// "Quiet" — the host reports no source playing.
    "none",
    /// Anything the host couldn't classify into the above. Mini-apps
    /// should treat this as "playing something I don't know about" and
    /// hide source-specific UI.
    "other"
  ]);
  var MediaPlayStateSchema = external_exports.enum(["playing", "paused", "stopped"]);
  var MediaSnapshotSchema = external_exports.object({
    title: external_exports.string().nullable(),
    artist: external_exports.string().nullable(),
    album: external_exports.string().nullable(),
    /// HTTPS URL to the album art if the source publishes one.
    /// Renderable directly from a `<img>`. The host fetches +
    /// caches; the URL is host-side, not the original CDN — so
    /// the bundle never reaches the source's tracking pixels.
    artUrl: external_exports.string().url().nullable(),
    state: MediaPlayStateSchema,
    source: MediaSourceSchema,
    /// 0.0–1.0 (inclusive). Normalised across whatever scale the
    /// underlying source uses.
    volume: external_exports.number().min(0).max(1),
    /// ISO-8601 timestamp the host captured this snapshot. UTC.
    at: external_exports.string().min(1)
  }).strict();
  var ClimateModeSchema = external_exports.enum(["heat", "cool", "auto", "fan", "off"]);
  var ClimateSnapshotSchema = external_exports.object({
    /// Current cabin temperature, in degrees Celsius. Host-side
    /// translation handles the OEM unit; mini-apps render in the
    /// user's preferred unit using `client.system.getSnapshot().units`.
    cabinTempC: external_exports.number(),
    /// User's setpoint, also in Celsius.
    setpointC: external_exports.number(),
    /// 0.0 (off) — 1.0 (max). Normalised by the host across the
    /// underlying HVAC's stepped scale.
    fanSpeed: external_exports.number().min(0).max(1),
    mode: ClimateModeSchema,
    /// Number of climate zones the underlying system exposes
    /// (single-zone = 1, dual = 2, ...). Lets the UI layout adapt.
    zoneCount: external_exports.number().int().min(1).max(8),
    /// ISO-8601 capture wall-clock, UTC.
    at: external_exports.string().min(1)
  }).strict();
  var GearPositionSchema = external_exports.enum(["P", "R", "N", "D", "M", "unknown"]);
  var TirePressureSchema = external_exports.object({
    frontLeft: external_exports.number().nullable(),
    frontRight: external_exports.number().nullable(),
    rearLeft: external_exports.number().nullable(),
    rearRight: external_exports.number().nullable()
  }).strict();
  var VehicleDiagnosticsSnapshotSchema = external_exports.object({
    tirePressure: TirePressureSchema,
    gearPosition: GearPositionSchema,
    /// Odometer, in km, bucketed by the host (floor 1000, ceiling
    /// 10000 km depending on regional fleet density) and offset by
    /// a per-launch ±100 km jitter. Stable within a session, varies
    /// across sessions.
    odometerKm: external_exports.number().nonnegative(),
    /// ISO-8601 capture wall-clock, UTC.
    at: external_exports.string().min(1)
  }).strict();
  var VehicleEnvironmentSnapshotSchema = external_exports.object({
    /// Air-quality index, 0–500. Nullable when the OEM doesn't
    /// publish one for this region.
    aqi: external_exports.number().nullable(),
    /// PM2.5 concentration in µg/m³.
    pm25: external_exports.number().nullable(),
    /// Ambient cabin light, in lux. Nullable on hosts without an
    /// ambient-light sensor.
    ambientLightLux: external_exports.number().nullable(),
    /// ISO-8601 capture wall-clock, UTC.
    at: external_exports.string().min(1)
  }).strict();
  var DistanceUnitSchema = external_exports.enum(["km", "mi"]);
  var TemperatureUnitSchema = external_exports.enum(["celsius", "fahrenheit"]);
  var OtaStatusSchema = external_exports.enum([
    "idle",
    "checking",
    "downloading",
    "ready_to_install",
    "installing",
    "failed"
  ]);
  var SystemSnapshotSchema = external_exports.object({
    otaStatus: OtaStatusSchema,
    units: external_exports.object({
      distance: DistanceUnitSchema,
      temperature: TemperatureUnitSchema
    }).strict(),
    /// 0.0 (dim) — 1.0 (max). The host normalises whatever scale the
    /// underlying display uses.
    displayBrightness: external_exports.number().min(0).max(1),
    /// ISO-8601 capture wall-clock, UTC.
    at: external_exports.string().min(1)
  }).strict();
  var NetworkTypeSchema = external_exports.enum(["wifi", "cellular", "ethernet", "offline", "unknown"]);
  var ConnectivitySnapshotSchema = external_exports.object({
    network: NetworkTypeSchema,
    /// Number of currently-paired Bluetooth devices the host knows
    /// about. Names / identifiers stay host-side.
    bluetoothPairedCount: external_exports.number().int().min(0),
    /// ISO-8601 capture wall-clock, UTC.
    at: external_exports.string().min(1)
  }).strict();
  var LocationSnapshotSchema = external_exports.object({
    /// Latitude in WGS-84 degrees. Always present.
    lat: external_exports.number().min(-90).max(90),
    /// Longitude in WGS-84 degrees.
    lng: external_exports.number().min(-180).max(180),
    /// Heading in degrees clockwise from true north (0..360),
    /// or `null` when the host is stationary / can't compute one.
    /// Apps that depend on heading should treat `null` as "use last
    /// known" or hide the directional UI.
    heading: external_exports.number().min(0).max(360).nullable(),
    /// Ground speed in metres per second. `null` when unknown.
    speedMps: external_exports.number().min(0).nullable(),
    /// Horizontal accuracy in metres (1-sigma estimate). `null` when
    /// the underlying GNSS fix doesn't publish one.
    accuracyM: external_exports.number().nonnegative().nullable(),
    /// ISO-8601 capture wall-clock, UTC.
    at: external_exports.string().min(1)
  }).strict();
  var NavManeuverSchema = external_exports.enum([
    "continue",
    "turn_left",
    "turn_right",
    "sharp_left",
    "sharp_right",
    "slight_left",
    "slight_right",
    "u_turn",
    "roundabout",
    "merge",
    "exit",
    "arrive",
    "unknown"
  ]);
  var NavigationSnapshotSchema = external_exports.object({
    active: external_exports.boolean(),
    /// Friendly destination name when active. `null` when no route
    /// or when the underlying engine has no label.
    destinationLabel: external_exports.string().nullable(),
    /// Remaining road distance to the active route's final waypoint,
    /// in metres. `null` when no route.
    distanceRemainingM: external_exports.number().nonnegative().nullable(),
    /// Estimated arrival, in seconds from `at`. `null` when the
    /// engine hasn't computed an ETA yet (e.g. just-started reroute).
    etaSeconds: external_exports.number().nonnegative().nullable(),
    /// Current maneuver hint. `null` when the engine isn't yet on a
    /// step (just left a roundabout, between turns, etc.).
    currentManeuver: NavManeuverSchema.nullable(),
    /// Distance to the next maneuver, in metres. `null` when no
    /// maneuver is queued or the engine doesn't publish a distance.
    distanceToTurnM: external_exports.number().nonnegative().nullable(),
    /// ISO-8601 capture wall-clock, UTC.
    at: external_exports.string().min(1)
  }).strict();

  // node_modules/.pnpm/i99dash@file+..+..+..+..+..+..+tmp+sdk-pack+i99dash-2.0.0.tgz_zod@3.25.76/node_modules/i99dash/dist/chunk-UYGIDVBX.js
  var DOCS_BASE = "docs/api-ref/errors.md";
  var SDKError = class extends Error {
    constructor(name, code, docsUrl, message, options) {
      super(message, options);
      // Custom class names survive minification gotchas better via this
      // pattern than `this.constructor.name`.
      __publicField(this, "name");
      /// Stable identifier — safe to switch on from consumer code.
      /// Typed as `string` (not `SDKErrorCode`) so downstream packages
      /// like `@i99dash/admin-sdk` can extend the hierarchy with their
      /// own codes while still using the same base class.
      __publicField(this, "code");
      /// Repo-relative docs path — e.g. `docs/api-ref/errors.md#bridge_timeout`.
      /// Always populated; intended for inclusion in error pages and dev
      /// tooling. Not a fully-qualified URL because the same SDK ships in
      /// docs at multiple bases (npm, GitHub, internal).
      __publicField(this, "docsUrl");
      this.name = name;
      this.code = code;
      this.docsUrl = docsUrl;
    }
  };
  var NotInsideHostError = class extends SDKError {
    constructor(detail) {
      super(
        "NotInsideHostError",
        "NOT_INSIDE_HOST",
        `${DOCS_BASE}#not_inside_host`,
        `mini-app SDK: no host bridge \u2014 ${detail} (see ${DOCS_BASE}#not_inside_host)`
      );
    }
  };
  var BridgeTransportError = class extends SDKError {
    constructor(message, cause) {
      super(
        "BridgeTransportError",
        "BRIDGE_TRANSPORT",
        `${DOCS_BASE}#bridge_transport`,
        `${message} (see ${DOCS_BASE}#bridge_transport)`,
        { cause }
      );
    }
  };
  var BridgeTimeoutError = class extends SDKError {
    constructor(operation, timeoutMs) {
      super(
        "BridgeTimeoutError",
        "BRIDGE_TIMEOUT",
        `${DOCS_BASE}#bridge_timeout`,
        `${operation} timed out after ${timeoutMs}ms (see ${DOCS_BASE}#bridge_timeout)`
      );
      __publicField(this, "operation");
      __publicField(this, "timeoutMs");
      this.operation = operation;
      this.timeoutMs = timeoutMs;
    }
  };
  var InvalidResponseError = class extends SDKError {
    constructor(detail, cause) {
      super(
        "InvalidResponseError",
        "INVALID_RESPONSE",
        `${DOCS_BASE}#invalid_response`,
        `invalid host response: ${detail} (see ${DOCS_BASE}#invalid_response)`,
        { cause }
      );
    }
  };
  var CarStatusUnavailableError = class extends SDKError {
    constructor(detail) {
      super(
        "CarStatusUnavailableError",
        "CAR_STATUS_UNAVAILABLE",
        `${DOCS_BASE}#car_status_unavailable`,
        `car status not available \u2014 ${detail} (see ${DOCS_BASE}#car_status_unavailable)`
      );
    }
  };
  var CallApiFailedError = class extends SDKError {
    constructor(errorCode, message) {
      super(
        "CallApiFailedError",
        "CALL_API_FAILED",
        `${DOCS_BASE}#call_api_failed`,
        `callApi failed [${errorCode}]: ${message} (see ${DOCS_BASE}#call_api_failed)`
      );
      /// The `error.code` from the protocol envelope — e.g.
      /// `'disallowed_path'`, `'http_4xx'`, `'timeout'`. Stable, switch-safe.
      __publicField(this, "errorCode");
      this.errorCode = errorCode;
    }
  };
  var MediaUnavailableError = class extends SDKError {
    constructor(detail) {
      super(
        "MediaUnavailableError",
        "MEDIA_UNAVAILABLE",
        `${DOCS_BASE}#media_unavailable`,
        `media not available \u2014 ${detail} (see ${DOCS_BASE}#media_unavailable)`
      );
    }
  };
  var ClimateUnavailableError = class extends SDKError {
    constructor(detail) {
      super(
        "ClimateUnavailableError",
        "CLIMATE_UNAVAILABLE",
        `${DOCS_BASE}#climate_unavailable`,
        `climate not available \u2014 ${detail} (see ${DOCS_BASE}#climate_unavailable)`
      );
    }
  };
  var VehicleDiagnosticsUnavailableError = class extends SDKError {
    constructor(detail) {
      super(
        "VehicleDiagnosticsUnavailableError",
        "VEHICLE_DIAGNOSTICS_UNAVAILABLE",
        `${DOCS_BASE}#vehicle_diagnostics_unavailable`,
        `vehicle.diagnostics not available \u2014 ${detail} (see ${DOCS_BASE}#vehicle_diagnostics_unavailable)`
      );
    }
  };
  var VehicleEnvironmentUnavailableError = class extends SDKError {
    constructor(detail) {
      super(
        "VehicleEnvironmentUnavailableError",
        "VEHICLE_ENVIRONMENT_UNAVAILABLE",
        `${DOCS_BASE}#vehicle_environment_unavailable`,
        `vehicle.environment not available \u2014 ${detail} (see ${DOCS_BASE}#vehicle_environment_unavailable)`
      );
    }
  };
  var SystemUnavailableError = class extends SDKError {
    constructor(detail) {
      super(
        "SystemUnavailableError",
        "SYSTEM_UNAVAILABLE",
        `${DOCS_BASE}#system_unavailable`,
        `system not available \u2014 ${detail} (see ${DOCS_BASE}#system_unavailable)`
      );
    }
  };
  var ConnectivityUnavailableError = class extends SDKError {
    constructor(detail) {
      super(
        "ConnectivityUnavailableError",
        "CONNECTIVITY_UNAVAILABLE",
        `${DOCS_BASE}#connectivity_unavailable`,
        `connectivity not available \u2014 ${detail} (see ${DOCS_BASE}#connectivity_unavailable)`
      );
    }
  };
  var LocationUnavailableError = class extends SDKError {
    constructor(detail) {
      super(
        "LocationUnavailableError",
        "LOCATION_UNAVAILABLE",
        `${DOCS_BASE}#location_unavailable`,
        `location not available \u2014 ${detail} (see ${DOCS_BASE}#location_unavailable)`
      );
    }
  };
  var NavigationUnavailableError = class extends SDKError {
    constructor(detail) {
      super(
        "NavigationUnavailableError",
        "NAVIGATION_UNAVAILABLE",
        `${DOCS_BASE}#navigation_unavailable`,
        `navigation not available \u2014 ${detail} (see ${DOCS_BASE}#navigation_unavailable)`
      );
    }
  };
  function isCarStatusBridge(b) {
    const c = b;
    return typeof c.getCarStatus === "function" && typeof c.subscribeCarStatus === "function" && typeof c.unsubscribeCarStatus === "function" && typeof c.subscribeCarConnectionState === "function" && typeof c.unsubscribeCarConnectionState === "function";
  }
  function isCapabilitiesBridge(b) {
    return typeof b.capabilities === "function";
  }
  function isMediaBridge(b) {
    const c = b;
    return typeof c.getMedia === "function" && typeof c.subscribeMedia === "function" && typeof c.unsubscribeMedia === "function";
  }
  function isClimateBridge(b) {
    const c = b;
    return typeof c.getClimate === "function" && typeof c.subscribeClimate === "function" && typeof c.unsubscribeClimate === "function";
  }
  function isVehicleDiagnosticsBridge(b) {
    const c = b;
    return typeof c.getVehicleDiagnostics === "function" && typeof c.subscribeVehicleDiagnostics === "function" && typeof c.unsubscribeVehicleDiagnostics === "function";
  }
  function isVehicleEnvironmentBridge(b) {
    const c = b;
    return typeof c.getVehicleEnvironment === "function" && typeof c.subscribeVehicleEnvironment === "function" && typeof c.unsubscribeVehicleEnvironment === "function";
  }
  function isSystemBridge(b) {
    const c = b;
    return typeof c.getSystem === "function" && typeof c.subscribeSystem === "function" && typeof c.unsubscribeSystem === "function";
  }
  function isConnectivityBridge(b) {
    const c = b;
    return typeof c.getConnectivity === "function" && typeof c.subscribeConnectivity === "function" && typeof c.unsubscribeConnectivity === "function";
  }
  function isNavigationBridge(b) {
    const c = b;
    return typeof c.getNavigation === "function" && typeof c.subscribeNavigation === "function" && typeof c.unsubscribeNavigation === "function";
  }
  function isFamilyBridge(b) {
    return typeof b.callFamily === "function";
  }
  var HOST_GLOBAL = "__i99dashHost";
  var LEGACY_HOST_GLOBAL = "flutter_inappwebview";
  function resolveHostApi(windowLike) {
    const branded = windowLike[HOST_GLOBAL];
    if (branded == null ? void 0 : branded.callHandler) return branded;
    const legacy = windowLike[LEGACY_HOST_GLOBAL];
    if (legacy == null ? void 0 : legacy.callHandler) return legacy;
    return void 0;
  }
  var HOST_EVENTS_GLOBAL = "__i99dashEvents";
  function ensureHostEvents() {
    if (typeof window === "undefined") {
      throw new NotInsideHostError("window is undefined \u2014 cannot install __i99dashEvents");
    }
    const w = window;
    const existing = w[HOST_EVENTS_GLOBAL];
    if (existing) return existing;
    const handlers = /* @__PURE__ */ new Map();
    const api = {
      on(channel, handler) {
        let bucket = handlers.get(channel);
        if (!bucket) {
          bucket = /* @__PURE__ */ new Set();
          handlers.set(channel, bucket);
        }
        bucket.add(handler);
        return () => {
          bucket == null ? void 0 : bucket.delete(handler);
        };
      },
      dispatch(channel, payload) {
        const bucket = handlers.get(channel);
        if (!bucket) return;
        for (const h of [...bucket]) {
          try {
            h(payload);
          } catch (e) {
            console.error("[i99dash] event handler threw:", e);
          }
        }
      }
    };
    w[HOST_EVENTS_GLOBAL] = api;
    return api;
  }
  var HostBridge = class {
    constructor(windowLike) {
      __publicField(this, "api");
      const w = windowLike != null ? windowLike : typeof window !== "undefined" ? window : void 0;
      if (!w) throw new NotInsideHostError("window is undefined");
      const api = resolveHostApi(w);
      if (!api) {
        throw new NotInsideHostError("host bridge is not present on window");
      }
      this.api = api;
    }
    async getContext() {
      try {
        return await this.api.callHandler("getContext");
      } catch (cause) {
        throw new BridgeTransportError("getContext bridge call failed", cause);
      }
    }
    async callApi(req) {
      try {
        return await this.api.callHandler("callApi", req);
      } catch (cause) {
        throw new BridgeTransportError("callApi bridge call failed", cause);
      }
    }
    async capabilities() {
      try {
        return await this.api.callHandler("capabilities");
      } catch (cause) {
        throw new BridgeTransportError("capabilities bridge call failed", cause);
      }
    }
    /// Generic family op. Routes to the host's `<familyId>.<op>`
    /// JS handler, which the host wires up to its
    /// [BridgeFamilyRegistry] + [FamilyExecutor]. Returns the host's
    /// success/error envelope verbatim — the controller decodes it.
    async callFamily(familyId, op, params, idempotencyKey) {
      const handlerName = `${familyId}.${op}`;
      const payload = {};
      if (params !== void 0) payload.params = params;
      if (idempotencyKey !== void 0) payload.idempotencyKey = idempotencyKey;
      try {
        return await this.api.callHandler(handlerName, payload);
      } catch (cause) {
        throw new BridgeTransportError(`${handlerName} bridge call failed`, cause);
      }
    }
    async getCarStatus() {
      try {
        return await this.api.callHandler("car.status.read");
      } catch (cause) {
        throw new BridgeTransportError("car.status.read bridge call failed", cause);
      }
    }
    async subscribeCarStatus(notify) {
      return this._subscribeChannel("car.status", notify);
    }
    async unsubscribeCarStatus(id) {
      return this._unsubscribeChannel("car.status", id);
    }
    async subscribeCarConnectionState(notify) {
      return this._subscribeChannel("car.connection", notify);
    }
    async unsubscribeCarConnectionState(id) {
      return this._unsubscribeChannel("car.connection", id);
    }
    async getMedia() {
      try {
        return await this.api.callHandler("media.read");
      } catch (cause) {
        throw new BridgeTransportError("media.read bridge call failed", cause);
      }
    }
    async subscribeMedia(notify) {
      return this._subscribeChannel("media", notify);
    }
    async unsubscribeMedia(id) {
      return this._unsubscribeChannel("media", id);
    }
    async getClimate() {
      try {
        return await this.api.callHandler("climate.read");
      } catch (cause) {
        throw new BridgeTransportError("climate.read bridge call failed", cause);
      }
    }
    async subscribeClimate(notify) {
      return this._subscribeChannel("climate", notify);
    }
    async unsubscribeClimate(id) {
      return this._unsubscribeChannel("climate", id);
    }
    async getVehicleDiagnostics() {
      try {
        return await this.api.callHandler("vehicle.diagnostics.read");
      } catch (cause) {
        throw new BridgeTransportError("vehicle.diagnostics.read bridge call failed", cause);
      }
    }
    async subscribeVehicleDiagnostics(notify) {
      return this._subscribeChannel("vehicle.diagnostics", notify);
    }
    async unsubscribeVehicleDiagnostics(id) {
      return this._unsubscribeChannel("vehicle.diagnostics", id);
    }
    async getVehicleEnvironment() {
      try {
        return await this.api.callHandler("vehicle.environment.read");
      } catch (cause) {
        throw new BridgeTransportError("vehicle.environment.read bridge call failed", cause);
      }
    }
    async subscribeVehicleEnvironment(notify) {
      return this._subscribeChannel("vehicle.environment", notify);
    }
    async unsubscribeVehicleEnvironment(id) {
      return this._unsubscribeChannel("vehicle.environment", id);
    }
    async getSystem() {
      try {
        return await this.api.callHandler("system.read");
      } catch (cause) {
        throw new BridgeTransportError("system.read bridge call failed", cause);
      }
    }
    async subscribeSystem(notify) {
      return this._subscribeChannel("system", notify);
    }
    async unsubscribeSystem(id) {
      return this._unsubscribeChannel("system", id);
    }
    async getConnectivity() {
      try {
        return await this.api.callHandler("connectivity.read");
      } catch (cause) {
        throw new BridgeTransportError("connectivity.read bridge call failed", cause);
      }
    }
    async subscribeConnectivity(notify) {
      return this._subscribeChannel("connectivity", notify);
    }
    async unsubscribeConnectivity(id) {
      return this._unsubscribeChannel("connectivity", id);
    }
    async getLocation() {
      try {
        return await this.api.callHandler("location.read");
      } catch (cause) {
        throw new BridgeTransportError("location.read bridge call failed", cause);
      }
    }
    async subscribeLocation(notify) {
      return this._subscribeChannel("location", notify);
    }
    async unsubscribeLocation(id) {
      return this._unsubscribeChannel("location", id);
    }
    async getNavigation() {
      try {
        return await this.api.callHandler("nav.read");
      } catch (cause) {
        throw new BridgeTransportError("nav.read bridge call failed", cause);
      }
    }
    async subscribeNavigation(notify) {
      return this._subscribeChannel("nav", notify);
    }
    async unsubscribeNavigation(id) {
      return this._unsubscribeChannel("nav", id);
    }
    /// Shared subscribe path for any push channel — `car.status`,
    /// `car.connection`, `media`, and future families.
    /// The host returns `{success: true, data: {id}}` envelopes
    /// (mirroring the `callApi` shape) so the bridge has one parsing
    /// contract to rely on.
    async _subscribeChannel(channel, notify) {
      const events = ensureHostEvents();
      const offEvent = events.on(channel, notify);
      let envelope;
      try {
        envelope = await this.api.callHandler(`${channel}.subscribe`);
      } catch (cause) {
        offEvent();
        throw new BridgeTransportError(`${channel}.subscribe bridge call failed`, cause);
      }
      const id = _extractId(envelope);
      if (id === null) {
        offEvent();
        throw new BridgeTransportError(`${channel}.subscribe returned envelope without id`, envelope);
      }
      _subscriptions.set(`${channel}:${id}`, offEvent);
      return { id };
    }
    async _unsubscribeChannel(channel, id) {
      const key = `${channel}:${id}`;
      const offEvent = _subscriptions.get(key);
      _subscriptions.delete(key);
      offEvent == null ? void 0 : offEvent();
      try {
        await this.api.callHandler(`${channel}.unsubscribe`, { id });
      } catch (cause) {
        throw new BridgeTransportError(`${channel}.unsubscribe bridge call failed`, cause);
      }
    }
  };
  var _subscriptions = /* @__PURE__ */ new Map();
  function _extractId(envelope) {
    if (!envelope || typeof envelope !== "object") return null;
    const e = envelope;
    if (e.success === true && e.data && typeof e.data === "object") {
      const id = e.data.id;
      if (typeof id === "string" && id.length > 0) return id;
    }
    if (typeof e.id === "string" && e.id.length > 0) return e.id;
    return null;
  }
  var CarStatusController = class {
    constructor(bridge) {
      __publicField(this, "bridge");
      /// Cached `key set` of the last successfully-parsed payload —
      /// sorted, joined by ``. Cheap to compare; safe to reuse
      /// because `CarStatusSchema` is `.strict()` (no rename surprise).
      __publicField(this, "_statusShape", null);
      __publicField(this, "_connShape", null);
      /// Page Visibility plumbing — installed lazily on the first
      /// `onStatusChange` so SSR / non-DOM consumers don't pay for an
      /// event listener that will never fire.
      __publicField(this, "_visibilityInstalled", false);
      __publicField(this, "_hidden", false);
      __publicField(this, "_statusListeners", /* @__PURE__ */ new Set());
      __publicField(this, "_connListeners", /* @__PURE__ */ new Set());
      __publicField(this, "_lastWhilePaused", null);
      /// Lazily-acquired subscription ids — null until first listener
      /// registers; reused for every subsequent listener; released when
      /// the last listener unsubscribes.
      __publicField(this, "_statusSubId", null);
      __publicField(this, "_connSubId", null);
      /// Per-field read-count buffer used to back the schema-evolution
      /// "is this field unused?" criterion (< 5% of active mini-apps
      /// touch it across 90 rolling days). Counts are incremented
      /// transparently as consumer code reads properties off the
      /// CarStatus value via a Proxy. The host-side telemetry sink
      /// that ingests these is wired in Phase 2 — until then, the
      /// buffer is read-only via [_telemetrySnapshot] for tests.
      __publicField(this, "_fieldReadCounts", /* @__PURE__ */ new Map());
      this.bridge = bridge;
    }
    /// Test-only: return a snapshot of the per-field read counts and
    /// reset the internal buffer. Underscore-prefixed to mark as
    /// non-stable surface; not part of `public-api.test.ts`'s lock list.
    /// Will be replaced by a host-side telemetry-flush integration in
    /// Phase 2.
    _telemetrySnapshot() {
      const out = {};
      for (const [k, v] of this._fieldReadCounts) out[k] = v;
      this._fieldReadCounts.clear();
      return out;
    }
    /// One-shot read. Throws [CarStatusUnavailableError] if the bridge
    /// doesn't implement the streaming surface (e.g., unit-test stub
    /// or older host).
    async getStatus() {
      if (!isCarStatusBridge(this.bridge)) {
        throw new CarStatusUnavailableError("bridge does not implement CarStatusBridge");
      }
      const raw = await this.bridge.getCarStatus();
      return this._parseStatus(raw);
    }
    /// Subscribe to status deltas. Returns an unsubscribe fn — the
    /// returned closure is idempotent (calling it twice is a no-op).
    ///
    /// First call lazily installs the bridge subscription + the page-
    /// visibility listener; last `off()` tears them down. So a
    /// consumer that subscribes once and unsubscribes correctly leaves
    /// no resources behind.
    onStatusChange(listener) {
      if (!isCarStatusBridge(this.bridge)) {
        throw new CarStatusUnavailableError("bridge does not implement CarStatusBridge");
      }
      const bridge = this.bridge;
      this._statusListeners.add(listener);
      this._installVisibility();
      if (this._statusSubId === null) {
        void bridge.subscribeCarStatus((raw) => this._dispatchStatus(raw)).then(({ id }) => {
          this._statusSubId = id;
        }).catch(() => {
          this._statusListeners.delete(listener);
        });
      }
      let off = false;
      return () => {
        if (off) return;
        off = true;
        this._statusListeners.delete(listener);
        if (this._statusListeners.size === 0 && this._statusSubId !== null) {
          const id = this._statusSubId;
          this._statusSubId = null;
          void bridge.unsubscribeCarStatus(id).catch(() => {
          });
        }
      };
    }
    /// Subscribe to host data-availability transitions. Same lifecycle
    /// pattern as [onStatusChange] — lazy setup, refcounted teardown.
    ///
    /// NOT page-visibility-paused: a backgrounded mini-app still wants
    /// to know if the data went stale, so the connection-banner can
    /// be correct on resume. The volume here is tiny (≤1 event per
    /// poll cycle).
    onConnectionChange(listener) {
      if (!isCarStatusBridge(this.bridge)) {
        throw new CarStatusUnavailableError("bridge does not implement CarStatusBridge");
      }
      const bridge = this.bridge;
      this._connListeners.add(listener);
      if (this._connSubId === null) {
        void bridge.subscribeCarConnectionState((raw) => this._dispatchConnection(raw)).then(({ id }) => {
          this._connSubId = id;
        }).catch(() => {
          this._connListeners.delete(listener);
        });
      }
      let off = false;
      return () => {
        if (off) return;
        off = true;
        this._connListeners.delete(listener);
        if (this._connListeners.size === 0 && this._connSubId !== null) {
          const id = this._connSubId;
          this._connSubId = null;
          void bridge.unsubscribeCarConnectionState(id).catch(() => {
          });
        }
      };
    }
    // ── Internals ────────────────────────────────────────────────────
    _installVisibility() {
      if (this._visibilityInstalled) return;
      this._visibilityInstalled = true;
      if (typeof document === "undefined") return;
      const onChange = () => {
        this._hidden = document.hidden;
        if (!this._hidden && this._lastWhilePaused !== null) {
          const buffered = this._lastWhilePaused;
          this._lastWhilePaused = null;
          for (const l of [...this._statusListeners]) {
            this._invokeSafe(l, buffered);
          }
        }
      };
      document.addEventListener("visibilitychange", onChange);
    }
    _dispatchStatus(raw) {
      let parsed;
      try {
        parsed = this._parseStatus(raw);
      } catch (e) {
        console.warn("[i99dash] dropped malformed car.status event:", e);
        return;
      }
      if (this._hidden) {
        this._lastWhilePaused = parsed;
        return;
      }
      for (const l of [...this._statusListeners]) {
        this._invokeSafe(l, parsed);
      }
    }
    _dispatchConnection(raw) {
      let parsed;
      try {
        parsed = this._parseConnection(raw);
      } catch {
        return;
      }
      for (const l of [...this._connListeners]) {
        try {
          l(parsed);
        } catch (e) {
          console.error("[i99dash] connection listener threw:", e);
        }
      }
    }
    _invokeSafe(l, s) {
      try {
        l(s);
      } catch (e) {
        console.error("[i99dash] car-status listener threw:", e);
      }
    }
    _parseStatus(raw) {
      const shape = _shapeFingerprint(raw);
      let parsed;
      if (shape !== null && shape === this._statusShape) {
        parsed = raw;
      } else {
        const result = CarStatusSchema.safeParse(raw);
        if (!result.success) {
          throw new InvalidResponseError("car.status payload did not match schema", result.error);
        }
        this._statusShape = shape;
        parsed = result.data;
      }
      return this._instrumentReads(parsed);
    }
    /// Wrap [s] in a Proxy whose `get` trap increments a per-field
    /// counter when consumer code reads a property. Skips internal
    /// JS lookups (Symbol keys, prototype methods) so React's
    /// `Object.is` shallow-comparison doesn't pollute the count.
    ///
    /// The wrapped value is `===`-distinct from the underlying object
    /// each time, but the values within are shared — JSON.stringify,
    /// destructure, and Object.entries all work normally. A consumer
    /// that calls `useMemo(() => ..., [status])` will re-run on every
    /// event, which is the correct behaviour anyway since each event
    /// represents a fresh push from the host.
    _instrumentReads(s) {
      const counts = this._fieldReadCounts;
      return new Proxy(s, {
        get(target, prop, receiver) {
          var _a;
          if (typeof prop === "string" && Object.prototype.hasOwnProperty.call(target, prop)) {
            counts.set(prop, ((_a = counts.get(prop)) != null ? _a : 0) + 1);
          }
          return Reflect.get(target, prop, receiver);
        }
      });
    }
    _parseConnection(raw) {
      const shape = _shapeFingerprint(raw);
      if (shape !== null && shape === this._connShape) {
        return raw;
      }
      const result = CarConnectionStateSchema.safeParse(raw);
      if (!result.success) {
        throw new InvalidResponseError("car.connection payload did not match schema", result.error);
      }
      this._connShape = shape;
      return result.data;
    }
  };
  function _shapeFingerprint(raw) {
    if (raw === null || typeof raw !== "object") return null;
    const keys = Object.keys(raw).sort();
    return keys.join("");
  }
  var ClimateController = class {
    constructor(bridge) {
      __publicField(this, "bridge");
      __publicField(this, "_shape", null);
      __publicField(this, "_visibilityInstalled", false);
      __publicField(this, "_hidden", false);
      __publicField(this, "_listeners", /* @__PURE__ */ new Set());
      __publicField(this, "_lastWhilePaused", null);
      __publicField(this, "_subId", null);
      this.bridge = bridge;
    }
    async getSnapshot() {
      if (!isClimateBridge(this.bridge)) {
        throw new ClimateUnavailableError("bridge does not implement ClimateBridge");
      }
      return this._parse(await this.bridge.getClimate());
    }
    onChange(listener) {
      if (!isClimateBridge(this.bridge)) {
        throw new ClimateUnavailableError("bridge does not implement ClimateBridge");
      }
      const bridge = this.bridge;
      this._listeners.add(listener);
      this._installVisibility();
      if (this._subId === null) {
        void bridge.subscribeClimate((raw) => this._dispatch(raw)).then(({ id }) => {
          this._subId = id;
        }).catch(() => {
          this._listeners.delete(listener);
        });
      }
      let off = false;
      return () => {
        if (off) return;
        off = true;
        this._listeners.delete(listener);
        if (this._listeners.size === 0 && this._subId !== null) {
          const id = this._subId;
          this._subId = null;
          void bridge.unsubscribeClimate(id).catch(() => {
          });
        }
      };
    }
    _installVisibility() {
      if (this._visibilityInstalled) return;
      this._visibilityInstalled = true;
      if (typeof document === "undefined") return;
      const onChange = () => {
        this._hidden = document.hidden;
        if (!this._hidden && this._lastWhilePaused !== null) {
          const buffered = this._lastWhilePaused;
          this._lastWhilePaused = null;
          for (const l of [...this._listeners]) this._invokeSafe(l, buffered);
        }
      };
      document.addEventListener("visibilitychange", onChange);
    }
    _dispatch(raw) {
      let parsed;
      try {
        parsed = this._parse(raw);
      } catch (e) {
        console.warn("[i99dash] dropped malformed climate event:", e);
        return;
      }
      if (this._hidden) {
        this._lastWhilePaused = parsed;
        return;
      }
      for (const l of [...this._listeners]) this._invokeSafe(l, parsed);
    }
    _invokeSafe(l, s) {
      try {
        l(s);
      } catch (e) {
        console.error("[i99dash] climate listener threw:", e);
      }
    }
    _parse(raw) {
      const shape = _shapeFingerprint2(raw);
      if (shape !== null && shape === this._shape) return raw;
      const result = ClimateSnapshotSchema.safeParse(raw);
      if (!result.success) {
        throw new InvalidResponseError("climate payload did not match schema", result.error);
      }
      this._shape = shape;
      return result.data;
    }
  };
  function _shapeFingerprint2(raw) {
    if (raw === null || typeof raw !== "object") return null;
    const keys = Object.keys(raw).sort();
    return keys.join("");
  }
  var ConnectivityController = class {
    constructor(bridge) {
      __publicField(this, "bridge");
      __publicField(this, "_shape", null);
      __publicField(this, "_visibilityInstalled", false);
      __publicField(this, "_hidden", false);
      __publicField(this, "_listeners", /* @__PURE__ */ new Set());
      __publicField(this, "_lastWhilePaused", null);
      __publicField(this, "_subId", null);
      this.bridge = bridge;
    }
    async getSnapshot() {
      if (!isConnectivityBridge(this.bridge)) {
        throw new ConnectivityUnavailableError("bridge does not implement ConnectivityBridge");
      }
      return this._parse(await this.bridge.getConnectivity());
    }
    onChange(listener) {
      if (!isConnectivityBridge(this.bridge)) {
        throw new ConnectivityUnavailableError("bridge does not implement ConnectivityBridge");
      }
      const bridge = this.bridge;
      this._listeners.add(listener);
      this._installVisibility();
      if (this._subId === null) {
        void bridge.subscribeConnectivity((raw) => this._dispatch(raw)).then(({ id }) => {
          this._subId = id;
        }).catch(() => {
          this._listeners.delete(listener);
        });
      }
      let off = false;
      return () => {
        if (off) return;
        off = true;
        this._listeners.delete(listener);
        if (this._listeners.size === 0 && this._subId !== null) {
          const id = this._subId;
          this._subId = null;
          void bridge.unsubscribeConnectivity(id).catch(() => {
          });
        }
      };
    }
    _installVisibility() {
      if (this._visibilityInstalled) return;
      this._visibilityInstalled = true;
      if (typeof document === "undefined") return;
      const onChange = () => {
        this._hidden = document.hidden;
        if (!this._hidden && this._lastWhilePaused !== null) {
          const buffered = this._lastWhilePaused;
          this._lastWhilePaused = null;
          for (const l of [...this._listeners]) this._invokeSafe(l, buffered);
        }
      };
      document.addEventListener("visibilitychange", onChange);
    }
    _dispatch(raw) {
      let parsed;
      try {
        parsed = this._parse(raw);
      } catch (e) {
        console.warn("[i99dash] dropped malformed connectivity event:", e);
        return;
      }
      if (this._hidden) {
        this._lastWhilePaused = parsed;
        return;
      }
      for (const l of [...this._listeners]) this._invokeSafe(l, parsed);
    }
    _invokeSafe(l, s) {
      try {
        l(s);
      } catch (e) {
        console.error("[i99dash] connectivity listener threw:", e);
      }
    }
    _parse(raw) {
      const shape = _shapeFingerprint3(raw);
      if (shape !== null && shape === this._shape) return raw;
      const result = ConnectivitySnapshotSchema.safeParse(raw);
      if (!result.success) {
        throw new InvalidResponseError("connectivity payload did not match schema", result.error);
      }
      this._shape = shape;
      return result.data;
    }
  };
  function _shapeFingerprint3(raw) {
    if (raw === null || typeof raw !== "object") return null;
    const keys = Object.keys(raw).sort();
    return keys.join("");
  }
  var FamilyOpError = class extends SDKError {
    constructor(familyId, op, code, message) {
      super(
        "FamilyOpError",
        "FAMILY_OP_FAILED",
        "docs/api-ref/families.md#family_op_failed",
        `${familyId}.${op} failed: ${code} \u2014 ${message}`
      );
      __publicField(this, "errorCode");
      __publicField(this, "familyId");
      __publicField(this, "op");
      this.errorCode = code;
      this.familyId = familyId;
      this.op = op;
    }
  };
  var FamilyUnavailableError = class extends SDKError {
    constructor(familyId, message) {
      super(
        "FamilyUnavailableError",
        "FAMILY_UNAVAILABLE",
        "docs/api-ref/families.md#family_unavailable",
        message != null ? message : `host does not ship the "${familyId}" family \u2014 feature-detect via client.has(scope) before calling`
      );
      __publicField(this, "familyId");
      this.familyId = familyId;
    }
  };
  function newIdempotencyKey() {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
    let s = "";
    for (let i = 0; i < 16; i++) s += Math.floor(Math.random() * 16).toString(16);
    return s;
  }
  function decodeFamilyEnvelope(familyId, op, raw) {
    var _a, _b, _c, _d;
    const env = raw;
    if (env && typeof env === "object" && "success" in env) {
      if (env.success) return env.data;
      throw new FamilyOpError(familyId, op, (_b = (_a = env.error) == null ? void 0 : _a.code) != null ? _b : "unknown", (_d = (_c = env.error) == null ? void 0 : _c.message) != null ? _d : "");
    }
    throw new FamilyOpError(
      familyId,
      op,
      "invalid_response",
      `host returned a payload that doesn't match the {success, data|error} envelope`
    );
  }
  var BaseFamilyController = class {
    constructor(bridge, familyId) {
      __publicField(this, "bridge");
      __publicField(this, "familyId");
      if (!isFamilyBridge(bridge)) {
        throw new FamilyUnavailableError(
          familyId,
          `bridge does not implement FamilyBridge \u2014 host build is too old`
        );
      }
      this.bridge = bridge;
      this.familyId = familyId;
    }
    async invoke(op, params, opts = {}) {
      var _a;
      const key = (_a = opts.idempotencyKey) != null ? _a : newIdempotencyKey();
      const raw = await this.bridge.callFamily(this.familyId, op, params, key);
      return decodeFamilyEnvelope(this.familyId, op, raw);
    }
    /// Subscribe to the host's event channel for this family. Calls
    /// the family's `subscribe` op (returning `{id}`), registers a
    /// listener on `__i99dashEvents` for `this.familyId`, and returns
    /// an [UnsubscribeFn] that:
    ///   1. Removes the in-process listener (immediate stop).
    ///   2. Fires the family's `unsubscribe` op with the host-issued
    ///      id (host-side cleanup).
    ///
    /// Idempotent: calling the returned closure twice is a no-op. The
    /// caller's `handler` is invoked once per native push with the
    /// already-typed payload — concrete controllers (e.g.
    /// `DisplayController.onChange`) wrap this with a typed cast.
    ///
    /// Errors during the host-side subscribe call propagate
    /// (`FamilyOpError` / `FamilyUnavailableError`) — that's the same
    /// surface every other family op uses; consumers don't need a
    /// separate error model for subscriptions.
    async subscribe(handler) {
      const events = ensureHostEvents();
      const offLocal = events.on(this.familyId, handler);
      let hostId;
      try {
        const data = await this.invoke("subscribe", {});
        hostId = data.id;
      } catch (err) {
        offLocal();
        throw err;
      }
      let off = false;
      return () => {
        if (off) return;
        off = true;
        offLocal();
        void this.invoke("unsubscribe", { id: hostId }).catch(() => {
        });
      };
    }
  };
  var BootController = class extends BaseFamilyController {
    constructor(bridge) {
      super(bridge, "boot");
    }
    /**
     * Declare that [packageName] should auto-launch on cold boot.
     * Idempotent on `(user, vin, app, packageName)` — calling `set`
     * again with the same `packageName` replaces the prior row.
     */
    async set(packageName, opts = {}, invokeOpts = {}) {
      return this.invoke(
        "set",
        {
          packageName,
          ...opts.displayId !== void 0 ? { displayId: opts.displayId } : {},
          ...opts.route !== void 0 ? { route: opts.route } : {}
        },
        invokeOpts
      );
    }
    /**
     * Every boot declaration this mini-app has set under the active
     * (user, vin). Other mini-apps' rows are not visible.
     */
    async list(invokeOpts = {}) {
      var _a;
      const r = await this.invoke("list", {}, invokeOpts);
      return (_a = r.entries) != null ? _a : [];
    }
    /**
     * Remove the declaration for [packageName]. No-op if the row
     * doesn't exist; returns the count actually removed (0 or 1).
     */
    async unset(packageName, invokeOpts = {}) {
      return this.invoke("unset", { packageName }, invokeOpts);
    }
  };
  var CursorController = class extends BaseFamilyController {
    constructor(bridge) {
      super(bridge, "cursor");
    }
    /**
     * Mount the cursor view on the IVI. Returns a [CursorHandle] for
     * subsequent move / style / detach calls.
     *
     * Throws `FamilyOpError` (code `attach_denied`) if the host
     * couldn't add the overlay window — typically because the
     * SYSTEM_ALERT_WINDOW grant hasn't propagated yet (cold pair
     * window). Retry after the user enables wireless debugging.
     */
    async attach(opts, invokeOpts = {}) {
      var _a;
      const result = await this.invoke(
        "attach",
        {
          targetDisplayId: opts.targetDisplayId,
          style: (_a = opts.style) != null ? _a : "dot"
        },
        invokeOpts
      );
      if (!result.ok) {
        throw new Error("cursor.attach refused by host \u2014 SYSTEM_ALERT_WINDOW likely not granted yet");
      }
      let detached = false;
      return {
        move: async (x, y) => {
          if (detached) return;
          await this.invoke("move", {
            x: Math.round(x),
            y: Math.round(y)
          });
        },
        setStyle: async (style) => {
          if (detached) return;
          await this.invoke("style", { style });
        },
        detach: async () => {
          if (detached) return;
          detached = true;
          await this.invoke("detach", {});
        }
      };
    }
  };
  var DisplayController = class extends BaseFamilyController {
    constructor(bridge) {
      super(bridge, "display");
    }
    /// One-shot snapshot of every addressable display, plus the active
    /// [`VehicleContext`] when the host emits it (1.6+).
    ///
    /// Returns the host envelope verbatim — `vehicle` is `undefined`
    /// on older hosts that don't ship the block, never an empty
    /// object. See [`DisplayListResult`] for the migration note from
    /// the 1.x bare-array return shape.
    async list(opts = {}) {
      return this.invoke("list", {}, opts);
    }
    /// Subscribe to display add/remove/changed events. The first
    /// emit is a `'snapshot'` carrying the full current list — same
    /// shape as `list()` returned, just delivered through the same
    /// event channel so consumers don't need a separate one-shot read
    /// to seed their UI.
    ///
    /// Returns a cleanup closure. Call it once when you're done — the
    /// SDK runs the host's `display.unsubscribe` for you. Calling it
    /// twice is a no-op.
    ///
    /// Throws `FamilyOpError` if the initial subscribe is rejected
    /// (e.g. `permission_denied`); after that, transient native
    /// errors are silently swallowed so a single hiccup doesn't kill
    /// the listener.
    async onChange(listener) {
      return this.subscribe((raw) => listener(raw));
    }
  };
  var GestureController = class extends BaseFamilyController {
    constructor(bridge) {
      super(bridge, "gesture");
    }
    async tap(opts, invokeOpts = {}) {
      return this.invoke(
        "tap",
        {
          displayId: opts.displayId,
          x: Math.round(opts.x),
          y: Math.round(opts.y)
        },
        invokeOpts
      );
    }
    async swipe(opts, invokeOpts = {}) {
      var _a;
      return this.invoke(
        "swipe",
        {
          displayId: opts.displayId,
          fromX: Math.round(opts.fromX),
          fromY: Math.round(opts.fromY),
          toX: Math.round(opts.toX),
          toY: Math.round(opts.toY),
          durationMs: (_a = opts.durationMs) != null ? _a : 300
        },
        invokeOpts
      );
    }
    async longPress(opts, invokeOpts = {}) {
      var _a;
      return this.invoke(
        "longPress",
        {
          displayId: opts.displayId,
          x: Math.round(opts.x),
          y: Math.round(opts.y),
          durationMs: (_a = opts.durationMs) != null ? _a : 800
        },
        invokeOpts
      );
    }
  };
  var PkgController = class extends BaseFamilyController {
    constructor(bridge) {
      super(bridge, "pkg");
    }
    /**
     * Enumerate installed packages (the launchable subset by default).
     * Uses the host's `PackageManager.queryIntentActivities` for
     * `ACTION_MAIN/CATEGORY_LAUNCHER` — every entry has at least one
     * launcher activity.
     */
    async list(opts = {}, invokeOpts = {}) {
      var _a, _b;
      const r = await this.invoke(
        "list",
        { includeSystem: (_a = opts.includeSystem) != null ? _a : false },
        invokeOpts
      );
      return (_b = r.packages) != null ? _b : [];
    }
    /**
     * Current foreground app. Returns null when the host can't
     * determine it (no UsageStatsManager grant, locked screen). The
     * mini-app should treat null as "ask again later", not as "no
     * app is running".
     */
    async foreground(invokeOpts = {}) {
      const r = await this.invoke("foreground", {}, invokeOpts);
      if (r.packageName == null) return null;
      return r;
    }
    /**
     * Per-package usage stats over a sliding window. Backed by
     * `UsageStatsManager.queryUsageStats`; rolled up server-side to
     * one row per package. Returns an empty list when the host
     * doesn't have the GET_USAGE_STATS appop — usage stats are
     * inherently best-effort.
     *
     * Window is capped at 24 hours (anything wider is rarely useful
     * for in-car launcher logic).
     */
    async usage(windowMs, invokeOpts = {}) {
      var _a, _b;
      const r = await this.invoke("usage", { windowMs }, invokeOpts);
      return { rows: (_a = r.rows) != null ? _a : [], windowMs: (_b = r.windowMs) != null ? _b : windowMs };
    }
    /**
     * Start an installed app, optionally on a non-default display.
     * Resolves the package's main launcher intent server-side; rejects
     * with `pkg_invalid` if the package name is malformed and
     * `pkg_launch_failed` if the OS rejects the launch.
     */
    async launch(packageName, opts = {}, invokeOpts = {}) {
      return this.invoke(
        "launch",
        {
          packageName,
          ...opts.displayId !== void 0 ? { displayId: opts.displayId } : {},
          ...opts.targetRole !== void 0 ? { targetRole: opts.targetRole } : {}
        },
        invokeOpts
      );
    }
    /**
     * Move a running package's task to another display. Use this for
     * "I set up the route on the IVI, now move the running app to the
     * passenger display" workflows where {@link launch} would
     * otherwise be foiled by the package's own router activity
     * auto-redirecting to the home display (Waze, certain BYD apps).
     *
     * Only `ivi` / `passenger` displays are accepted — cluster moves
     * use {@link moveCluster}. Returns `{ok: false, path: 'denied',
     * error: 'package not running'}` if the package isn't currently
     * running. The host uses `am stack move-task` over loopback ADB,
     * the same path the surface family uses for cluster surfaces.
     */
    async move(packageName, opts, invokeOpts = {}) {
      return this.invoke(
        "move",
        { packageName, displayId: opts.displayId },
        invokeOpts
      );
    }
    /**
     * Cluster-targeted launch. Same shape as {@link launch} but the
     * host enforces that the displayId resolves to a `cluster` role
     * (driver-instrument virtual display). Requires
     * `pkg.launch.cluster` in `manifest.permissions[]`.
     *
     * Returns `{ok: false, path: 'denied', error: 'role:expected_cluster_got_<role>'}`
     * if the displayId belongs to ivi / passenger / unknown. The
     * caller should pick its target from `display.list()` filtered to
     * `role === 'cluster'`.
     */
    async launchCluster(packageName, opts, invokeOpts = {}) {
      return this.invoke(
        "launch_cluster",
        { packageName, displayId: opts.displayId },
        invokeOpts
      );
    }
    /**
     * Cluster-targeted move. Same role contract as
     * {@link launchCluster}; same `pkg.launch.cluster` permission.
     */
    async moveCluster(packageName, opts, invokeOpts = {}) {
      return this.invoke(
        "move_cluster",
        { packageName, displayId: opts.displayId },
        invokeOpts
      );
    }
    /**
     * `am force-stop {packageName}`. Symmetric inverse of
     * {@link launch} / {@link launchCluster}: tear down a package the
     * mini-app previously started so the original surface owner
     * (e.g. XDJA's projection on the cluster) can reclaim the slot.
     *
     * Permission: `pkg.launch` (the same scope you needed to start
     * the app in the first place — no separate `pkg.stop` scope).
     */
    async stop(packageName, invokeOpts = {}) {
      return this.invoke("stop", { packageName }, invokeOpts);
    }
  };
  var LocationController = class {
    /** Kept on the constructor for signature compat — the SDK builds
     *  this controller via the same factory shape every other family
     *  uses. The bridge isn't consulted by the new geolocation path. */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(_bridge) {
      __publicField(this, "_shape", null);
      __publicField(this, "_visibilityInstalled", false);
      __publicField(this, "_hidden", false);
      __publicField(this, "_listeners", /* @__PURE__ */ new Set());
      __publicField(this, "_watchId", null);
      __publicField(this, "_lastWhilePaused", null);
    }
    /// One-shot fix. Resolves with the current `LocationSnapshot` or
    /// rejects with `LocationUnavailableError` when:
    ///   * `navigator.geolocation` is missing (e.g. SSR / unit tests),
    ///   * the WebView denied the permission (manifest didn't declare
    ///     `location.read`, or the user revoked at the OS level), or
    ///   * the host took longer than 10 s to return a fix.
    async getSnapshot() {
      const geo = _geo();
      if (geo === null) {
        throw new LocationUnavailableError("navigator.geolocation not available");
      }
      const position = await new Promise((resolve, reject) => {
        geo.getCurrentPosition(
          resolve,
          (err) => reject(_geoError(err)),
          // High accuracy: GNSS fix preferred over wifi/cell. timeout
          // 10s — same budget the legacy bridge used; matches the
          // user's perception window for "show me where I am". Cached
          // fix up to 30s old is fine — it's location for a weather
          // refresh / navigation ETA, not surveying.
          { enableHighAccuracy: true, timeout: 1e4, maximumAge: 3e4 }
        );
      });
      return this._parse(_positionToSnapshot(position));
    }
    /// Subscribe to position updates. The SDK fans out a single
    /// `watchPosition` call to N listeners, then unsubscribes from
    /// the platform when the last listener leaves — same lifecycle
    /// the legacy bridge offered, just sourced from the standard
    /// API. The returned cleanup is idempotent.
    onChange(listener) {
      const geo = _geo();
      if (geo === null) {
        throw new LocationUnavailableError("navigator.geolocation not available");
      }
      this._listeners.add(listener);
      this._installVisibility();
      if (this._watchId === null) {
        this._watchId = geo.watchPosition(
          (position) => {
            let parsed;
            try {
              parsed = this._parse(_positionToSnapshot(position));
            } catch (e) {
              console.warn("[i99dash] dropped malformed location event:", e);
              return;
            }
            if (this._hidden) {
              this._lastWhilePaused = parsed;
              return;
            }
            for (const l of [...this._listeners]) this._invokeSafe(l, parsed);
          },
          (err) => {
            console.warn("[i99dash] watchPosition error:", err.message);
          },
          { enableHighAccuracy: true, maximumAge: 3e4 }
        );
      }
      let off = false;
      return () => {
        if (off) return;
        off = true;
        this._listeners.delete(listener);
        if (this._listeners.size === 0 && this._watchId !== null) {
          const id = this._watchId;
          this._watchId = null;
          geo.clearWatch(id);
        }
      };
    }
    _installVisibility() {
      if (this._visibilityInstalled) return;
      this._visibilityInstalled = true;
      if (typeof document === "undefined") return;
      const onChange = () => {
        this._hidden = document.hidden;
        if (!this._hidden && this._lastWhilePaused !== null) {
          const buffered = this._lastWhilePaused;
          this._lastWhilePaused = null;
          for (const l of [...this._listeners]) this._invokeSafe(l, buffered);
        }
      };
      document.addEventListener("visibilitychange", onChange);
    }
    _invokeSafe(l, s) {
      try {
        l(s);
      } catch (e) {
        console.error("[i99dash] location listener threw:", e);
      }
    }
    _parse(raw) {
      const shape = _shapeFingerprint4(raw);
      if (shape !== null && shape === this._shape) return raw;
      const result = LocationSnapshotSchema.safeParse(raw);
      if (!result.success) {
        throw new InvalidResponseError("location payload did not match schema", result.error);
      }
      this._shape = shape;
      return result.data;
    }
  };
  function _geo() {
    var _a;
    if (typeof navigator === "undefined") return null;
    return (_a = navigator.geolocation) != null ? _a : null;
  }
  function _positionToSnapshot(p) {
    const c = p.coords;
    return {
      lat: c.latitude,
      lng: c.longitude,
      heading: typeof c.heading === "number" && !Number.isNaN(c.heading) ? c.heading : null,
      speedMps: typeof c.speed === "number" && !Number.isNaN(c.speed) ? c.speed : null,
      accuracyM: typeof c.accuracy === "number" && Number.isFinite(c.accuracy) ? c.accuracy : null,
      at: new Date(p.timestamp).toISOString()
    };
  }
  function _geoError(err) {
    switch (err.code) {
      case 1:
        return new LocationUnavailableError(`permission denied: ${err.message}`);
      case 2:
        return new LocationUnavailableError(`position unavailable: ${err.message}`);
      case 3:
        return new LocationUnavailableError(`timeout: ${err.message}`);
      default:
        return new LocationUnavailableError(err.message || "geolocation failed");
    }
  }
  function _shapeFingerprint4(raw) {
    if (raw === null || typeof raw !== "object") return null;
    const keys = Object.keys(raw).sort();
    return keys.join("");
  }
  var MediaController = class {
    constructor(bridge) {
      __publicField(this, "bridge");
      /// Cached `key set` of the last successfully-parsed payload —
      /// same fast-path as [CarStatusController].
      __publicField(this, "_shape", null);
      __publicField(this, "_visibilityInstalled", false);
      __publicField(this, "_hidden", false);
      __publicField(this, "_listeners", /* @__PURE__ */ new Set());
      __publicField(this, "_lastWhilePaused", null);
      __publicField(this, "_subId", null);
      this.bridge = bridge;
    }
    /// One-shot read. Throws [MediaUnavailableError] if the bridge
    /// doesn't ship the media surface (older host, unit-test stub).
    async getSnapshot() {
      if (!isMediaBridge(this.bridge)) {
        throw new MediaUnavailableError("bridge does not implement MediaBridge");
      }
      const raw = await this.bridge.getMedia();
      return this._parse(raw);
    }
    /// Subscribe to media events. Returns an idempotent unsubscribe fn.
    /// First call lazily installs the bridge subscription + the
    /// page-visibility listener; last `off()` tears them down.
    onChange(listener) {
      if (!isMediaBridge(this.bridge)) {
        throw new MediaUnavailableError("bridge does not implement MediaBridge");
      }
      const bridge = this.bridge;
      this._listeners.add(listener);
      this._installVisibility();
      if (this._subId === null) {
        void bridge.subscribeMedia((raw) => this._dispatch(raw)).then(({ id }) => {
          this._subId = id;
        }).catch(() => {
          this._listeners.delete(listener);
        });
      }
      let off = false;
      return () => {
        if (off) return;
        off = true;
        this._listeners.delete(listener);
        if (this._listeners.size === 0 && this._subId !== null) {
          const id = this._subId;
          this._subId = null;
          void bridge.unsubscribeMedia(id).catch(() => {
          });
        }
      };
    }
    // ── Internals ────────────────────────────────────────────────────
    _installVisibility() {
      if (this._visibilityInstalled) return;
      this._visibilityInstalled = true;
      if (typeof document === "undefined") return;
      const onChange = () => {
        this._hidden = document.hidden;
        if (!this._hidden && this._lastWhilePaused !== null) {
          const buffered = this._lastWhilePaused;
          this._lastWhilePaused = null;
          for (const l of [...this._listeners]) {
            this._invokeSafe(l, buffered);
          }
        }
      };
      document.addEventListener("visibilitychange", onChange);
    }
    _dispatch(raw) {
      let parsed;
      try {
        parsed = this._parse(raw);
      } catch (e) {
        console.warn("[i99dash] dropped malformed media event:", e);
        return;
      }
      if (this._hidden) {
        this._lastWhilePaused = parsed;
        return;
      }
      for (const l of [...this._listeners]) {
        this._invokeSafe(l, parsed);
      }
    }
    _invokeSafe(l, s) {
      try {
        l(s);
      } catch (e) {
        console.error("[i99dash] media listener threw:", e);
      }
    }
    _parse(raw) {
      const shape = _shapeFingerprint5(raw);
      if (shape !== null && shape === this._shape) {
        return raw;
      }
      const result = MediaSnapshotSchema.safeParse(raw);
      if (!result.success) {
        throw new InvalidResponseError("media payload did not match schema", result.error);
      }
      this._shape = shape;
      return result.data;
    }
  };
  function _shapeFingerprint5(raw) {
    if (raw === null || typeof raw !== "object") return null;
    const keys = Object.keys(raw).sort();
    return keys.join("");
  }
  var NavigationController = class {
    constructor(bridge) {
      __publicField(this, "bridge");
      __publicField(this, "_shape", null);
      __publicField(this, "_visibilityInstalled", false);
      __publicField(this, "_hidden", false);
      __publicField(this, "_listeners", /* @__PURE__ */ new Set());
      __publicField(this, "_lastWhilePaused", null);
      __publicField(this, "_subId", null);
      this.bridge = bridge;
    }
    async getSnapshot() {
      if (!isNavigationBridge(this.bridge)) {
        throw new NavigationUnavailableError("bridge does not implement NavigationBridge");
      }
      return this._parse(await this.bridge.getNavigation());
    }
    onChange(listener) {
      if (!isNavigationBridge(this.bridge)) {
        throw new NavigationUnavailableError("bridge does not implement NavigationBridge");
      }
      const bridge = this.bridge;
      this._listeners.add(listener);
      this._installVisibility();
      if (this._subId === null) {
        void bridge.subscribeNavigation((raw) => this._dispatch(raw)).then(({ id }) => {
          this._subId = id;
        }).catch(() => {
          this._listeners.delete(listener);
        });
      }
      let off = false;
      return () => {
        if (off) return;
        off = true;
        this._listeners.delete(listener);
        if (this._listeners.size === 0 && this._subId !== null) {
          const id = this._subId;
          this._subId = null;
          void bridge.unsubscribeNavigation(id).catch(() => {
          });
        }
      };
    }
    _installVisibility() {
      if (this._visibilityInstalled) return;
      this._visibilityInstalled = true;
      if (typeof document === "undefined") return;
      const onChange = () => {
        this._hidden = document.hidden;
        if (!this._hidden && this._lastWhilePaused !== null) {
          const buffered = this._lastWhilePaused;
          this._lastWhilePaused = null;
          for (const l of [...this._listeners]) this._invokeSafe(l, buffered);
        }
      };
      document.addEventListener("visibilitychange", onChange);
    }
    _dispatch(raw) {
      let parsed;
      try {
        parsed = this._parse(raw);
      } catch (e) {
        console.warn("[i99dash] dropped malformed nav event:", e);
        return;
      }
      if (this._hidden) {
        this._lastWhilePaused = parsed;
        return;
      }
      for (const l of [...this._listeners]) this._invokeSafe(l, parsed);
    }
    _invokeSafe(l, s) {
      try {
        l(s);
      } catch (e) {
        console.error("[i99dash] nav listener threw:", e);
      }
    }
    _parse(raw) {
      const shape = _shapeFingerprint6(raw);
      if (shape !== null && shape === this._shape) return raw;
      const result = NavigationSnapshotSchema.safeParse(raw);
      if (!result.success) {
        throw new InvalidResponseError("nav payload did not match schema", result.error);
      }
      this._shape = shape;
      return result.data;
    }
  };
  function _shapeFingerprint6(raw) {
    if (raw === null || typeof raw !== "object") return null;
    const keys = Object.keys(raw).sort();
    return keys.join("");
  }
  var SystemController = class {
    constructor(bridge) {
      __publicField(this, "bridge");
      __publicField(this, "_shape", null);
      __publicField(this, "_visibilityInstalled", false);
      __publicField(this, "_hidden", false);
      __publicField(this, "_listeners", /* @__PURE__ */ new Set());
      __publicField(this, "_lastWhilePaused", null);
      __publicField(this, "_subId", null);
      this.bridge = bridge;
    }
    async getSnapshot() {
      if (!isSystemBridge(this.bridge)) {
        throw new SystemUnavailableError("bridge does not implement SystemBridge");
      }
      return this._parse(await this.bridge.getSystem());
    }
    onChange(listener) {
      if (!isSystemBridge(this.bridge)) {
        throw new SystemUnavailableError("bridge does not implement SystemBridge");
      }
      const bridge = this.bridge;
      this._listeners.add(listener);
      this._installVisibility();
      if (this._subId === null) {
        void bridge.subscribeSystem((raw) => this._dispatch(raw)).then(({ id }) => {
          this._subId = id;
        }).catch(() => {
          this._listeners.delete(listener);
        });
      }
      let off = false;
      return () => {
        if (off) return;
        off = true;
        this._listeners.delete(listener);
        if (this._listeners.size === 0 && this._subId !== null) {
          const id = this._subId;
          this._subId = null;
          void bridge.unsubscribeSystem(id).catch(() => {
          });
        }
      };
    }
    _installVisibility() {
      if (this._visibilityInstalled) return;
      this._visibilityInstalled = true;
      if (typeof document === "undefined") return;
      const onChange = () => {
        this._hidden = document.hidden;
        if (!this._hidden && this._lastWhilePaused !== null) {
          const buffered = this._lastWhilePaused;
          this._lastWhilePaused = null;
          for (const l of [...this._listeners]) this._invokeSafe(l, buffered);
        }
      };
      document.addEventListener("visibilitychange", onChange);
    }
    _dispatch(raw) {
      let parsed;
      try {
        parsed = this._parse(raw);
      } catch (e) {
        console.warn("[i99dash] dropped malformed system event:", e);
        return;
      }
      if (this._hidden) {
        this._lastWhilePaused = parsed;
        return;
      }
      for (const l of [...this._listeners]) this._invokeSafe(l, parsed);
    }
    _invokeSafe(l, s) {
      try {
        l(s);
      } catch (e) {
        console.error("[i99dash] system listener threw:", e);
      }
    }
    _parse(raw) {
      const shape = _shapeFingerprint7(raw);
      if (shape !== null && shape === this._shape) return raw;
      const result = SystemSnapshotSchema.safeParse(raw);
      if (!result.success) {
        throw new InvalidResponseError("system payload did not match schema", result.error);
      }
      this._shape = shape;
      return result.data;
    }
  };
  function _shapeFingerprint7(raw) {
    if (raw === null || typeof raw !== "object") return null;
    const keys = Object.keys(raw).sort();
    return keys.join("");
  }
  var VehicleDiagnosticsController = class {
    constructor(bridge) {
      __publicField(this, "bridge");
      __publicField(this, "_shape", null);
      __publicField(this, "_visibilityInstalled", false);
      __publicField(this, "_hidden", false);
      __publicField(this, "_listeners", /* @__PURE__ */ new Set());
      __publicField(this, "_lastWhilePaused", null);
      __publicField(this, "_subId", null);
      this.bridge = bridge;
    }
    async getSnapshot() {
      if (!isVehicleDiagnosticsBridge(this.bridge)) {
        throw new VehicleDiagnosticsUnavailableError(
          "bridge does not implement VehicleDiagnosticsBridge"
        );
      }
      return this._parse(await this.bridge.getVehicleDiagnostics());
    }
    onChange(listener) {
      if (!isVehicleDiagnosticsBridge(this.bridge)) {
        throw new VehicleDiagnosticsUnavailableError(
          "bridge does not implement VehicleDiagnosticsBridge"
        );
      }
      const bridge = this.bridge;
      this._listeners.add(listener);
      this._installVisibility();
      if (this._subId === null) {
        void bridge.subscribeVehicleDiagnostics((raw) => this._dispatch(raw)).then(({ id }) => {
          this._subId = id;
        }).catch(() => {
          this._listeners.delete(listener);
        });
      }
      let off = false;
      return () => {
        if (off) return;
        off = true;
        this._listeners.delete(listener);
        if (this._listeners.size === 0 && this._subId !== null) {
          const id = this._subId;
          this._subId = null;
          void bridge.unsubscribeVehicleDiagnostics(id).catch(() => {
          });
        }
      };
    }
    _installVisibility() {
      if (this._visibilityInstalled) return;
      this._visibilityInstalled = true;
      if (typeof document === "undefined") return;
      const onChange = () => {
        this._hidden = document.hidden;
        if (!this._hidden && this._lastWhilePaused !== null) {
          const buffered = this._lastWhilePaused;
          this._lastWhilePaused = null;
          for (const l of [...this._listeners]) this._invokeSafe(l, buffered);
        }
      };
      document.addEventListener("visibilitychange", onChange);
    }
    _dispatch(raw) {
      let parsed;
      try {
        parsed = this._parse(raw);
      } catch (e) {
        console.warn("[i99dash] dropped malformed vehicle.diagnostics event:", e);
        return;
      }
      if (this._hidden) {
        this._lastWhilePaused = parsed;
        return;
      }
      for (const l of [...this._listeners]) this._invokeSafe(l, parsed);
    }
    _invokeSafe(l, s) {
      try {
        l(s);
      } catch (e) {
        console.error("[i99dash] vehicle.diagnostics listener threw:", e);
      }
    }
    _parse(raw) {
      const shape = _shapeFingerprint8(raw);
      if (shape !== null && shape === this._shape) return raw;
      const result = VehicleDiagnosticsSnapshotSchema.safeParse(raw);
      if (!result.success) {
        throw new InvalidResponseError(
          "vehicle.diagnostics payload did not match schema",
          result.error
        );
      }
      this._shape = shape;
      return result.data;
    }
  };
  function _shapeFingerprint8(raw) {
    if (raw === null || typeof raw !== "object") return null;
    const keys = Object.keys(raw).sort();
    return keys.join("");
  }
  var VehicleEnvironmentController = class {
    constructor(bridge) {
      __publicField(this, "bridge");
      __publicField(this, "_shape", null);
      __publicField(this, "_visibilityInstalled", false);
      __publicField(this, "_hidden", false);
      __publicField(this, "_listeners", /* @__PURE__ */ new Set());
      __publicField(this, "_lastWhilePaused", null);
      __publicField(this, "_subId", null);
      this.bridge = bridge;
    }
    async getSnapshot() {
      if (!isVehicleEnvironmentBridge(this.bridge)) {
        throw new VehicleEnvironmentUnavailableError(
          "bridge does not implement VehicleEnvironmentBridge"
        );
      }
      return this._parse(await this.bridge.getVehicleEnvironment());
    }
    onChange(listener) {
      if (!isVehicleEnvironmentBridge(this.bridge)) {
        throw new VehicleEnvironmentUnavailableError(
          "bridge does not implement VehicleEnvironmentBridge"
        );
      }
      const bridge = this.bridge;
      this._listeners.add(listener);
      this._installVisibility();
      if (this._subId === null) {
        void bridge.subscribeVehicleEnvironment((raw) => this._dispatch(raw)).then(({ id }) => {
          this._subId = id;
        }).catch(() => {
          this._listeners.delete(listener);
        });
      }
      let off = false;
      return () => {
        if (off) return;
        off = true;
        this._listeners.delete(listener);
        if (this._listeners.size === 0 && this._subId !== null) {
          const id = this._subId;
          this._subId = null;
          void bridge.unsubscribeVehicleEnvironment(id).catch(() => {
          });
        }
      };
    }
    _installVisibility() {
      if (this._visibilityInstalled) return;
      this._visibilityInstalled = true;
      if (typeof document === "undefined") return;
      const onChange = () => {
        this._hidden = document.hidden;
        if (!this._hidden && this._lastWhilePaused !== null) {
          const buffered = this._lastWhilePaused;
          this._lastWhilePaused = null;
          for (const l of [...this._listeners]) this._invokeSafe(l, buffered);
        }
      };
      document.addEventListener("visibilitychange", onChange);
    }
    _dispatch(raw) {
      let parsed;
      try {
        parsed = this._parse(raw);
      } catch (e) {
        console.warn("[i99dash] dropped malformed vehicle.environment event:", e);
        return;
      }
      if (this._hidden) {
        this._lastWhilePaused = parsed;
        return;
      }
      for (const l of [...this._listeners]) this._invokeSafe(l, parsed);
    }
    _invokeSafe(l, s) {
      try {
        l(s);
      } catch (e) {
        console.error("[i99dash] vehicle.environment listener threw:", e);
      }
    }
    _parse(raw) {
      const shape = _shapeFingerprint9(raw);
      if (shape !== null && shape === this._shape) return raw;
      const result = VehicleEnvironmentSnapshotSchema.safeParse(raw);
      if (!result.success) {
        throw new InvalidResponseError(
          "vehicle.environment payload did not match schema",
          result.error
        );
      }
      this._shape = shape;
      return result.data;
    }
  };
  function _shapeFingerprint9(raw) {
    if (raw === null || typeof raw !== "object") return null;
    const keys = Object.keys(raw).sort();
    return keys.join("");
  }
  var PermissionDeniedAggregator = class {
    constructor() {
      __publicField(this, "_listeners", /* @__PURE__ */ new Set());
    }
    /// Subscribe a handler for any `permission_denied` envelope the SDK
    /// observes. Returns an idempotent unsubscribe fn.
    ///
    /// `scope` is the family identifier the failed call was nominally
    /// asking for — e.g. `'callApi:/api/v1/foo'`, `'car.status'`,
    /// `'media.read'`. The aggregator does not normalise; it forwards
    /// whatever the controller declared.
    on(listener) {
      this._listeners.add(listener);
      let off = false;
      return () => {
        if (off) return;
        off = true;
        this._listeners.delete(listener);
      };
    }
    /// Internal — controllers call this when they see a
    /// `permission_denied` envelope. Catches per-listener throws so one
    /// buggy analytics handler can't silence the others.
    emit(scope) {
      for (const l of [...this._listeners]) {
        try {
          l(scope);
        } catch (e) {
          console.error("[i99dash] permission-denied listener threw:", e);
        }
      }
    }
  };
  function withTimeout(operation, timeoutMs, task, externalSignal) {
    if (externalSignal == null ? void 0 : externalSignal.aborted) return Promise.reject(externalSignal.reason);
    const ac = new AbortController();
    return new Promise((resolve, reject) => {
      let settled = false;
      const settle = (fn) => {
        if (settled) return;
        settled = true;
        fn();
      };
      const timeoutId = setTimeout(() => {
        settle(() => reject(new BridgeTimeoutError(operation, timeoutMs)));
        ac.abort();
      }, timeoutMs);
      let detachExternal = () => {
      };
      if (externalSignal) {
        const onExtAbort = () => {
          settle(() => reject(externalSignal.reason));
          ac.abort();
        };
        externalSignal.addEventListener("abort", onExtAbort, { once: true });
        detachExternal = () => externalSignal.removeEventListener("abort", onExtAbort);
      }
      task(ac.signal).then(
        (value) => {
          clearTimeout(timeoutId);
          detachExternal();
          settle(() => resolve(value));
        },
        (err) => {
          clearTimeout(timeoutId);
          detachExternal();
          settle(() => reject(err));
        }
      );
    });
  }
  var SurfaceController = class extends BaseFamilyController {
    constructor(bridge) {
      super(bridge, "surface");
    }
    /// Open a surface on the requested display. The host tries
    /// `Presentation.show()` first and auto-falls-back to a
    /// `TYPE_APPLICATION_OVERLAY` view if denied. Throws
    /// `FamilyOpError` with code `surface_denied` if neither path
    /// works (e.g. permission revoked, hardware doesn't support a
    /// secondary surface).
    async create(req, opts = {}) {
      return this.invoke(
        "create",
        { displayId: req.displayId, ...req.route ? { route: req.route } : {} },
        opts
      );
    }
    /// Navigate the surface to a new route within the mini-app
    /// bundle. Same allowlist rules as the primary WebView's
    /// navigation gate apply; off-bundle URLs are rejected at the
    /// host.
    async navigate(req, opts = {}) {
      return this.invoke(
        "navigate",
        { surfaceId: req.surfaceId, route: req.route },
        opts
      );
    }
    /// Tear down a previously-opened surface.
    async destroy(req, opts = {}) {
      return this.invoke("destroy", { surfaceId: req.surfaceId }, opts);
    }
    /// List currently-open surfaces this mini-app owns.
    async list(opts = {}) {
      const data = await this.invoke("list", {}, opts);
      return data.surfaces;
    }
  };
  var DEFAULT_TIMEOUT_MS = 1e4;
  var MiniAppClient = class _MiniAppClient {
    constructor(bridge) {
      __publicField(this, "bridge");
      __publicField(this, "_car");
      __publicField(this, "_media");
      __publicField(this, "_climate");
      __publicField(this, "_vehicleDiagnostics");
      __publicField(this, "_vehicleEnvironment");
      __publicField(this, "_system");
      __publicField(this, "_connectivity");
      __publicField(this, "_location");
      __publicField(this, "_navigation");
      __publicField(this, "_display");
      __publicField(this, "_surface");
      __publicField(this, "_gesture");
      __publicField(this, "_cursor");
      __publicField(this, "_pkg");
      __publicField(this, "_boot");
      __publicField(this, "_capsCache");
      __publicField(this, "_permissionDenied", new PermissionDeniedAggregator());
      this.bridge = bridge;
    }
    /// Real-time car status surface. Lazy — the controller and any
    /// underlying bridge subscriptions are not created until the
    /// consumer first calls `client.car.getStatus()` or
    /// `client.car.onStatusChange(...)`.
    ///
    /// Throws `CarStatusUnavailableError` from those methods if the
    /// underlying bridge doesn't implement `CarStatusBridge` (e.g.,
    /// unit-test stub or older host).
    get car() {
      var _a;
      (_a = this._car) != null ? _a : this._car = new CarStatusController(this.bridge);
      return this._car;
    }
    /// Media surface. Same lazy-construction + capability-check pattern
    /// as [car]. Throws `MediaUnavailableError` from `getSnapshot()` /
    /// `onChange()` when the bridge doesn't ship the `media.read`
    /// family. Use `await client.has('media.read')` to feature-detect
    /// at app start.
    get media() {
      var _a;
      (_a = this._media) != null ? _a : this._media = new MediaController(this.bridge);
      return this._media;
    }
    /// Cabin-climate surface (`climate.read` scope). Throws
    /// `ClimateUnavailableError` when the bridge lacks the family.
    get climate() {
      var _a;
      (_a = this._climate) != null ? _a : this._climate = new ClimateController(this.bridge);
      return this._climate;
    }
    /// Vehicle-diagnostics surface (`vehicle.diagnostics` scope).
    /// Read-only tire pressure / gear / coarsened odometer.
    get vehicleDiagnostics() {
      var _a;
      (_a = this._vehicleDiagnostics) != null ? _a : this._vehicleDiagnostics = new VehicleDiagnosticsController(this.bridge);
      return this._vehicleDiagnostics;
    }
    /// Vehicle-environment surface (`vehicle.environment` scope).
    /// AQI / PM2.5 / ambient light. Distinct from diagnostics so an
    /// AQI widget doesn't have to over-claim diagnostic permissions.
    get vehicleEnvironment() {
      var _a;
      (_a = this._vehicleEnvironment) != null ? _a : this._vehicleEnvironment = new VehicleEnvironmentController(this.bridge);
      return this._vehicleEnvironment;
    }
    /// Host-system surface (`system.read` scope). OTA status, units,
    /// display brightness — keeps mini-app UI in sync with host UI.
    get system() {
      var _a;
      (_a = this._system) != null ? _a : this._system = new SystemController(this.bridge);
      return this._system;
    }
    /// Connectivity surface (`connectivity.read` scope). Network type
    /// + paired-device count for graceful-degradation UIs.
    get connectivity() {
      var _a;
      (_a = this._connectivity) != null ? _a : this._connectivity = new ConnectivityController(this.bridge);
      return this._connectivity;
    }
    /// Location surface (`location.read` scope). PII tier — gated by
    /// manifest declaration AND the host's consent prompt. The host
    /// returns `permission_denied` envelopes (forwarded to
    /// `client.onPermissionDenied`) when consent is missing.
    get location() {
      var _a;
      (_a = this._location) != null ? _a : this._location = new LocationController(this.bridge);
      return this._location;
    }
    /// Navigation surface (`nav.read` scope). PII tier — same gates as
    /// `location`. Reveals destinations the user picked; intended for
    /// nav-companion mini-apps that opt in.
    get navigation() {
      var _a;
      (_a = this._navigation) != null ? _a : this._navigation = new NavigationController(this.bridge);
      return this._navigation;
    }
    /// Display enumeration (`display.read` scope, tier-1). Returns the
    /// list of addressable displays — the head unit's primary IVI, the
    /// instrument cluster, and any passenger / HUD virtual displays the
    /// vehicle exposes. Required to call `client.surface.create`.
    get display() {
      var _a;
      (_a = this._display) != null ? _a : this._display = new DisplayController(this.bridge);
      return this._display;
    }
    /// Multi-display rendering (`surface.write` scope, tier-2 with
    /// install-time consent). Open a Presentation / overlay surface on
    /// a target display so the mini-app can render outside the IVI
    /// (e.g. a custom widget on the instrument cluster). Falls back to
    /// `TYPE_APPLICATION_OVERLAY` when the platform denies a
    /// Presentation; reports `path` so diagnostics can branch.
    get surface() {
      var _a;
      (_a = this._surface) != null ? _a : this._surface = new SurfaceController(this.bridge);
      return this._surface;
    }
    /// Synthetic-input surface (`gesture.dispatch` scope, tier-2 with
    /// per-action step-up). Inject taps / swipes / longPresses on a
    /// target display via the host's RemoteControlAccessibilityService.
    /// The realistic "remote control of cluster" capability when pixel
    /// rendering is signature-gated (Leopard 8 — see PHASE_B_PLAN.md).
    get gesture() {
      var _a;
      (_a = this._gesture) != null ? _a : this._gesture = new GestureController(this.bridge);
      return this._gesture;
    }
    /// IVI-side cursor surface (`cursor.write` scope, tier-2 with
    /// 5-second hot-path bypass on `move`). Mounts a touchpad-style
    /// indicator on the IVI as visual feedback for where the eventual
    /// `gesture.dispatch` will land. Pairs with [gesture] for "drive
    /// cluster apps from the IVI" mini-apps.
    get cursor() {
      var _a;
      (_a = this._cursor) != null ? _a : this._cursor = new CursorController(this.bridge);
      return this._cursor;
    }
    /// Package surface (`pkg.read` tier-1 + `pkg.launch` tier-2).
    /// Read-side handlers (`list`, `foreground`, `usage`) are
    /// available on a secondary surface; the launch handler is
    /// IVI-only.  Powers "open this app on the cluster" launchers
    /// and "now playing on IVI" widgets.
    get pkg() {
      var _a;
      (_a = this._pkg) != null ? _a : this._pkg = new PkgController(this.bridge);
      return this._pkg;
    }
    /// Boot-launch surface (`boot.write` tier-2). Declare which
    /// packages auto-launch on cold boot, optionally pinned to a
    /// non-default display.  Persists across reboots in the host's
    /// admin DB; per-mini-app isolation prevents cross-app
    /// snooping of declarations.
    get boot() {
      var _a;
      (_a = this._boot) != null ? _a : this._boot = new BootController(this.bridge);
      return this._boot;
    }
    static fromWindow() {
      if (typeof window === "undefined") {
        throw new NotInsideHostError("window is undefined (SSR or Node)");
      }
      return new _MiniAppClient(new HostBridge());
    }
    static withBridge(bridge) {
      return new _MiniAppClient(bridge);
    }
    /// Returns the current host context. Schema-validated — a host that
    /// ships a newer shape with new fields stays compatible (zod strips
    /// unknown properties by default on `.parse`), but a host that drops
    /// a required field throws `InvalidResponseError` here rather than
    /// propagating a half-typed value.
    async getContext(opts) {
      var _a;
      const timeout = (_a = opts == null ? void 0 : opts.timeoutMs) != null ? _a : DEFAULT_TIMEOUT_MS;
      const raw = await withTimeout(
        "getContext",
        timeout,
        () => this.bridge.getContext(),
        opts == null ? void 0 : opts.signal
      );
      const parsed = MiniAppContextSchema.safeParse(raw);
      if (!parsed.success) {
        throw new InvalidResponseError("getContext payload did not match schema", parsed.error);
      }
      return parsed.data;
    }
    /// Proxies [req] through the host's allow-listed `callApi`.
    ///
    /// NOTE: this method does **not** throw on `{success: false}`
    /// responses. A `disallowed_path` response is a legitimate thing the
    /// caller can handle — surfacing it as an exception would force
    /// consumers to `try/catch` the happy path too. Genuine errors
    /// (bridge transport, timeout, malformed envelope) do throw.
    async callApi(req, opts) {
      var _a;
      const timeout = (_a = opts == null ? void 0 : opts.timeoutMs) != null ? _a : DEFAULT_TIMEOUT_MS;
      const raw = await withTimeout("callApi", timeout, () => this.bridge.callApi(req), opts == null ? void 0 : opts.signal);
      const parsed = CallApiResponseSchema.safeParse(raw);
      if (!parsed.success) {
        throw new InvalidResponseError("callApi envelope did not match schema", parsed.error);
      }
      const env = parsed.data;
      if (!env.success && env.error.code === "permission_denied") {
        this._permissionDenied.emit(`callApi:${req.path}`);
      }
      return env;
    }
    /// Like [callApi] but lifts a `{success: false}` envelope into a
    /// thrown [CallApiFailedError]. The original protocol error code is
    /// preserved on `err.errorCode` so a `try/catch` consumer can still
    /// branch on it.
    ///
    /// Use this when the failure is genuinely exceptional and the
    /// envelope-unwrap noise is worse than the throw — e.g. inside a
    /// React `useQuery`, a Suspense boundary, or any code that wants
    /// the typed-data path uncluttered. Stick with [callApi] for code
    /// that wants happy/sad-path symmetry.
    async callApiOrThrow(req, opts) {
      const r = await this.callApi(req, opts);
      if (r.success) return r.data;
      throw new CallApiFailedError(r.error.code, r.error.message);
    }
    /// Bridge-capability handshake. Returns the host's declared
    /// `bridgeVersion` and the set of permission/family scopes it has
    /// handlers for.
    ///
    /// Older hosts that pre-date the handshake handler don't expose
    /// `capabilities` — calling this on such a host returns the SDK's
    /// best-effort fallback (`bridgeVersion: 'unknown'`, families
    /// derived from the bridge's structural capabilities). That keeps
    /// `client.has(scope)` deterministic across host versions.
    async capabilities(opts) {
      var _a;
      if (this._capsCache) return this._capsCache;
      const bridge = this.bridge;
      if (!isCapabilitiesBridge(bridge)) {
        const families = [];
        const b = bridge;
        if (typeof b.getCarStatus === "function" && typeof b.subscribeCarStatus === "function") {
          families.push("car.status");
        }
        this._capsCache = { bridgeVersion: "unknown", families };
        return this._capsCache;
      }
      const timeout = (_a = opts == null ? void 0 : opts.timeoutMs) != null ? _a : DEFAULT_TIMEOUT_MS;
      const raw = await withTimeout(
        "capabilities",
        timeout,
        () => bridge.capabilities(),
        opts == null ? void 0 : opts.signal
      );
      const parsed = HostCapabilitiesSchema.safeParse(raw);
      if (!parsed.success) {
        throw new InvalidResponseError("capabilities payload did not match schema", parsed.error);
      }
      this._capsCache = parsed.data;
      return parsed.data;
    }
    /// Predicate over the host's capabilities. Memoised by
    /// [capabilities]; first call hits the bridge, subsequent calls are
    /// in-process. Cheap to call from render paths.
    ///
    /// Idiomatic use:
    ///
    ///   if (await client.has('media.read')) { ... } else { ... }
    async has(scope) {
      const caps = await this.capabilities();
      return caps.families.includes(scope);
    }
    /// Subscribe an analytics-style handler to every `permission_denied`
    /// failure the SDK observes — across `callApi` and (in a future
    /// release) any new family controller. Returns an idempotent
    /// unsubscribe fn.
    ///
    /// `scope` argument forwarded to the listener identifies which
    /// surface produced the denial — e.g. `callApi:/api/v1/foo`,
    /// `media.read`. App code typically forwards to its analytics
    /// pipeline:
    ///
    ///   client.onPermissionDenied(scope => analytics.track('denied', { scope }));
    onPermissionDenied(listener) {
      return this._permissionDenied.on(listener);
    }
  };

  // src/main.js
  function _toSnapshot(p) {
    return {
      lat: p.coords.latitude,
      lng: p.coords.longitude,
      heading: typeof p.coords.heading === "number" && !Number.isNaN(p.coords.heading) ? p.coords.heading : null,
      speedMps: typeof p.coords.speed === "number" && !Number.isNaN(p.coords.speed) ? p.coords.speed : null,
      accuracyM: typeof p.coords.accuracy === "number" && Number.isFinite(p.coords.accuracy) ? p.coords.accuracy : null,
      at: new Date(p.timestamp).toISOString()
    };
  }
  async function getLocationSnapshot() {
    if (typeof window !== "undefined" && window.flutter_inappwebview && typeof window.flutter_inappwebview.callHandler === "function") {
      try {
        const raw = await window.flutter_inappwebview.callHandler("location.read");
        if (raw && raw.success === false) {
          throw new LocationUnavailableError(
            raw.error && raw.error.message || "location bridge denied"
          );
        }
        const data = raw && raw.data || raw;
        return data;
      } catch (e) {
        throw e instanceof LocationUnavailableError ? e : new LocationUnavailableError(e.message || String(e));
      }
    }
    return new Promise((resolve, reject) => {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        return reject(new LocationUnavailableError("navigator.geolocation not available"));
      }
      navigator.geolocation.getCurrentPosition(
        (p) => resolve(_toSnapshot(p)),
        (err) => reject(new LocationUnavailableError(err.message || "geolocation failed")),
        { enableHighAccuracy: false, timeout: 3e4, maximumAge: 5 * 6e4 }
      );
    });
  }
  function watchLocation(cb) {
    let stopped = false;
    let timer = null;
    const tick = async () => {
      if (stopped) return;
      try {
        const snap = await getLocationSnapshot();
        cb(snap);
      } catch (e) {
        console.warn("[weather-ahead] location poll error:", e.message);
      }
      if (!stopped) timer = setTimeout(tick, 6e4);
    };
    timer = setTimeout(tick, 6e4);
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }
  var OPEN_METEO_URL = (lat, lng) => `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code,precipitation,relative_humidity_2m,uv_index&forecast_hours=24&timezone=auto`;
  var NOMINATIM_URL = (lat, lng) => `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10`;
  var LOCATION_DEBOUNCE_MS = 5 * 60 * 1e3;
  function wmoToEmoji(code) {
    if (code === 0) return "\u2600\uFE0F";
    if (code <= 2) return "\u{1F324}\uFE0F";
    if (code === 3) return "\u2601\uFE0F";
    if (code <= 49) return "\u{1F32B}\uFE0F";
    if (code <= 57) return "\u{1F326}\uFE0F";
    if (code <= 67) return "\u{1F327}\uFE0F";
    if (code <= 77) return "\u2744\uFE0F";
    if (code <= 82) return "\u{1F327}\uFE0F";
    if (code <= 86) return "\u{1F328}\uFE0F";
    if (code <= 99) return "\u26C8\uFE0F";
    return "\u{1F321}\uFE0F";
  }
  function wmoToSummary(code, locale2) {
    const en = summaryEn(code);
    if (locale2 !== "ar") return en;
    return summaryAr(code) || en;
  }
  function summaryEn(code) {
    if (code === 0) return "Clear sky";
    if (code === 1) return "Mainly clear";
    if (code === 2) return "Partly cloudy";
    if (code === 3) return "Overcast";
    if (code <= 9) return "Fog";
    if (code <= 19) return "Fog";
    if (code <= 29) return "Fog likely";
    if (code <= 39) return "Fog";
    if (code <= 49) return "Fog";
    if (code <= 51) return "Light drizzle";
    if (code <= 53) return "Drizzle";
    if (code <= 55) return "Heavy drizzle";
    if (code <= 57) return "Freezing drizzle";
    if (code <= 61) return "Light rain";
    if (code <= 63) return "Moderate rain";
    if (code <= 65) return "Heavy rain";
    if (code <= 67) return "Freezing rain";
    if (code <= 71) return "Light snow";
    if (code <= 73) return "Moderate snow";
    if (code <= 75) return "Heavy snow";
    if (code === 77) return "Snow grains";
    if (code <= 80) return "Light showers";
    if (code <= 81) return "Moderate showers";
    if (code <= 82) return "Heavy showers";
    if (code <= 86) return "Snow showers";
    if (code <= 99) return "Thunderstorm";
    return "Unknown";
  }
  function summaryAr(code) {
    if (code === 0) return "\u0633\u0645\u0627\u0621 \u0635\u0627\u0641\u064A\u0629";
    if (code === 1) return "\u0635\u0627\u0641\u064D \u0641\u064A \u0645\u0639\u0638\u0645\u0647";
    if (code === 2) return "\u063A\u0627\u0626\u0645 \u062C\u0632\u0626\u064A\u0627\u064B";
    if (code === 3) return "\u063A\u0627\u0626\u0645";
    if (code <= 49) return "\u0636\u0628\u0627\u0628";
    if (code <= 55) return "\u0631\u0630\u0627\u0630";
    if (code <= 57) return "\u0631\u0630\u0627\u0630 \u0645\u062A\u062C\u0645\u062F";
    if (code <= 61) return "\u0645\u0637\u0631 \u062E\u0641\u064A\u0641";
    if (code <= 63) return "\u0645\u0637\u0631 \u0645\u0639\u062A\u062F\u0644";
    if (code <= 65) return "\u0645\u0637\u0631 \u063A\u0632\u064A\u0631";
    if (code <= 67) return "\u0645\u0637\u0631 \u0645\u062A\u062C\u0645\u062F";
    if (code <= 75) return "\u062B\u0644\u062C";
    if (code === 77) return "\u062D\u0628\u064A\u0628\u0627\u062A \u062B\u0644\u062C";
    if (code <= 82) return "\u0632\u062E\u0627\u062A \u0645\u0637\u0631";
    if (code <= 86) return "\u0632\u062E\u0627\u062A \u062B\u0644\u062C";
    if (code <= 99) return "\u0639\u0627\u0635\u0641\u0629 \u0631\u0639\u062F\u064A\u0629";
    return null;
  }
  function isRainCode(code) {
    return code >= 50 && code <= 67 || code >= 80 && code <= 82 || code >= 95 && code <= 99;
  }
  function isFogCode(code) {
    return code >= 10 && code <= 49;
  }
  var locale = "en";
  var coords = null;
  var coordsSource = "none";
  var weatherData = null;
  var lastFetchAt = null;
  var lastLocationChangeAt = 0;
  var fetchInFlight = false;
  var T = {
    en: {
      title: "Weather Ahead",
      locating: "Locating you\u2026",
      locOk: (label) => `Live \xB7 ${label}`,
      locFallback: "Location unavailable \u2014 showing fallback",
      locDenied: "Location not granted",
      fetchErr: "Could not load weather \u2014 tap Refresh",
      refresh: "Refresh",
      refreshing: "Refreshing\u2026",
      precipTitle: "Precipitation \u2014 next 6 hours",
      windLabel: "km/h wind",
      humidityLabel: "humidity",
      uvLabel: "UV index",
      aheadLabel: (min) => `T + ${min} min`,
      lastUpdated: (s) => `Updated ${s}`,
      clear: "Clear",
      rainEta: (min) => `Rain in ~${min} min`,
      fogLikely: "Fog likely"
    },
    ar: {
      title: "\u0627\u0644\u0637\u0642\u0633 \u0639\u0644\u0649 \u0627\u0644\u0637\u0631\u064A\u0642",
      locating: "\u062C\u0627\u0631\u064D \u062A\u062D\u062F\u064A\u062F \u0645\u0648\u0642\u0639\u0643\u2026",
      locOk: (label) => `\u0645\u0628\u0627\u0634\u0631 \xB7 ${label}`,
      locFallback: "\u0627\u0644\u0645\u0648\u0642\u0639 \u063A\u064A\u0631 \u0645\u062A\u0627\u062D",
      locDenied: "\u0644\u0645 \u064A\u064F\u0645\u0646\u062D \u0625\u0630\u0646 \u0627\u0644\u0645\u0648\u0642\u0639",
      fetchErr: "\u062A\u0639\u0630\u0651\u0631 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0637\u0642\u0633 \u2014 \u0627\u0636\u063A\u0637 \u062A\u062D\u062F\u064A\u062B",
      refresh: "\u062A\u062D\u062F\u064A\u062B",
      refreshing: "\u062C\u0627\u0631\u064D \u0627\u0644\u062A\u062D\u062F\u064A\u062B\u2026",
      precipTitle: "\u0627\u0644\u0623\u0645\u0637\u0627\u0631 \u2014 \u0627\u0644\u0633\u0627\u0639\u0627\u062A \u0627\u0644\u0633\u062A \u0627\u0644\u0642\u0627\u062F\u0645\u0629",
      windLabel: "\u0643\u0645/\u0633 \u0631\u064A\u0627\u062D",
      humidityLabel: "\u0631\u0637\u0648\u0628\u0629",
      uvLabel: "UV",
      aheadLabel: (min) => `+ ${min} \u062F\u0642\u064A\u0642\u0629`,
      lastUpdated: (s) => `\u0622\u062E\u0631 \u062A\u062D\u062F\u064A\u062B ${s}`,
      clear: "\u0635\u0627\u0641\u064D",
      rainEta: (min) => `\u0645\u0637\u0631 \u062E\u0644\u0627\u0644 ~${min} \u062F`,
      fogLikely: "\u0636\u0628\u0627\u0628 \u0645\u062D\u062A\u0645\u0644"
    }
  };
  function t() {
    return T[locale] || T.en;
  }
  var $ = (id) => document.getElementById(id);
  async function reversGeocode(lat, lng) {
    var _a, _b, _c, _d, _e;
    try {
      const r = await fetch(NOMINATIM_URL(lat, lng), {
        headers: { "Accept-Language": locale }
      });
      if (!r.ok) return null;
      const j = await r.json();
      return ((_a = j.address) == null ? void 0 : _a.city) || ((_b = j.address) == null ? void 0 : _b.town) || ((_c = j.address) == null ? void 0 : _c.village) || ((_d = j.address) == null ? void 0 : _d.county) || ((_e = j.address) == null ? void 0 : _e.state) || null;
    } catch {
      return null;
    }
  }
  async function fetchWeather(lat, lng) {
    if (fetchInFlight) return;
    fetchInFlight = true;
    setRefreshLoading(true);
    try {
      const r = await fetch(OPEN_METEO_URL(lat, lng));
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      weatherData = await r.json();
      lastFetchAt = /* @__PURE__ */ new Date();
      renderAll();
      reversGeocode(lat, lng).then((city) => {
        if (city) $("city-name").textContent = city;
      });
    } catch (e) {
      console.error("Weather fetch error:", e);
      showFetchError();
    } finally {
      fetchInFlight = false;
      setRefreshLoading(false);
      updateLastUpdated();
    }
  }
  function renderAll() {
    if (!weatherData) return;
    hideLoadingOverlay();
    renderNow();
    renderAheadCards();
    renderPrecipChart();
    renderDetails();
  }
  function renderNow() {
    const c = weatherData.current;
    if (!c) return;
    $("now-temp").textContent = `${Math.round(c.temperature_2m)}\xB0`;
    $("now-icon").textContent = wmoToEmoji(c.weather_code);
    $("now-condition").textContent = wmoToSummary(c.weather_code, locale);
  }
  function hourlyIndexAt(hourlyTimes, offsetMinutes) {
    const target = Date.now() + offsetMinutes * 60 * 1e3;
    let bestIdx = 0;
    let bestDelta = Infinity;
    for (let i = 0; i < hourlyTimes.length; i++) {
      const d = Math.abs(new Date(hourlyTimes[i]).getTime() - target);
      if (d < bestDelta) {
        bestDelta = d;
        bestIdx = i;
      }
    }
    return bestIdx;
  }
  function renderAheadCards() {
    var _a, _b, _c, _d, _e;
    const h = weatherData.hourly;
    if (!h) return;
    const nowTemp = (_b = (_a = weatherData.current) == null ? void 0 : _a.temperature_2m) != null ? _b : 0;
    const offsets = [30, 60, 90];
    for (const offset of offsets) {
      const idx = hourlyIndexAt(h.time, offset);
      const temp = Math.round((_c = h.temperature_2m[idx]) != null ? _c : 0);
      const code = (_d = h.weather_code[idx]) != null ? _d : 0;
      const precip = (_e = h.precipitation[idx]) != null ? _e : 0;
      const delta = temp - Math.round(nowTemp);
      const id = `ahead-${offset}`;
      $(id + "-label").textContent = t().aheadLabel(offset);
      $(id + "-icon").textContent = wmoToEmoji(code);
      $(id + "-temp").textContent = `${temp}\xB0`;
      const deltaEl = $(id + "-delta");
      if (delta > 0) {
        deltaEl.textContent = `(+${delta}\xB0)`;
        deltaEl.className = "ahead-temp-delta delta-pos";
      } else if (delta < 0) {
        deltaEl.textContent = `(${delta}\xB0)`;
        deltaEl.className = "ahead-temp-delta delta-neg";
      } else {
        deltaEl.textContent = `(0\xB0)`;
        deltaEl.className = "ahead-temp-delta delta-zero";
      }
      let summary = wmoToSummary(code, locale);
      if (precip > 0.1 && isRainCode(code)) {
        summary = wmoToSummary(code, locale);
      }
      $(id + "-summary").textContent = summary;
      const card = $(id);
      card.classList.toggle("rain-alert", isRainCode(code) && precip > 0.1);
      card.classList.toggle("fog-alert", isFogCode(code));
    }
  }
  var CHART_W = 700;
  var CHART_BAR_AREA_H = 70;
  var CHART_BASE_Y = 80;
  var MAX_MM = 4;
  var SVG_NS = "http://www.w3.org/2000/svg";
  function renderPrecipChart() {
    var _a;
    const h = weatherData.hourly;
    if (!h) return;
    $("precip-title").textContent = t().precipTitle;
    const nowIdx = hourlyIndexAt(h.time, 0);
    const bars = [];
    for (let i = 0; i < 6; i++) {
      const idx = nowIdx + i;
      bars.push({
        mm: (_a = h.precipitation[idx]) != null ? _a : 0,
        label: i === 0 ? locale === "ar" ? "\u0627\u0644\u0622\u0646" : "now" : `+${i}h`
      });
    }
    const barsGroup = $("precip-bars");
    const labelsGroup = $("precip-labels");
    const gridGroup = $("precip-grid");
    barsGroup.innerHTML = "";
    labelsGroup.innerHTML = "";
    gridGroup.innerHTML = "";
    const colW = CHART_W / bars.length;
    for (const mm of [1, 2]) {
      const y = CHART_BASE_Y - mm / MAX_MM * CHART_BAR_AREA_H;
      const line = document.createElementNS(SVG_NS, "line");
      line.setAttribute("x1", "0");
      line.setAttribute("x2", String(CHART_W));
      line.setAttribute("y1", String(y));
      line.setAttribute("y2", String(y));
      line.setAttribute("stroke", "currentColor");
      line.setAttribute("stroke-width", "0.8");
      line.setAttribute("opacity", "0.2");
      line.style.color = "var(--muted)";
      gridGroup.appendChild(line);
      const txt = document.createElementNS(SVG_NS, "text");
      txt.setAttribute("x", "4");
      txt.setAttribute("y", String(y - 2));
      txt.setAttribute("font-size", "9");
      txt.setAttribute("fill", "var(--muted)");
      txt.setAttribute("opacity", "0.7");
      txt.textContent = `${mm}mm`;
      gridGroup.appendChild(txt);
    }
    for (let i = 0; i < bars.length; i++) {
      const { mm, label } = bars[i];
      const barH = Math.max(2, Math.min(mm / MAX_MM, 1) * CHART_BAR_AREA_H);
      const x = i * colW + colW * 0.15;
      const w = colW * 0.7;
      const y = CHART_BASE_Y - barH;
      const rect = document.createElementNS(SVG_NS, "rect");
      rect.setAttribute("x", String(x));
      rect.setAttribute("y", String(y));
      rect.setAttribute("width", String(w));
      rect.setAttribute("height", String(barH));
      rect.setAttribute("rx", "3");
      rect.setAttribute("fill", "var(--rain)");
      rect.setAttribute("opacity", mm > 0.05 ? "0.85" : "0.2");
      barsGroup.appendChild(rect);
      if (mm >= 0.1) {
        const valTxt = document.createElementNS(SVG_NS, "text");
        valTxt.setAttribute("x", String(x + w / 2));
        valTxt.setAttribute("y", String(y - 3));
        valTxt.setAttribute("text-anchor", "middle");
        valTxt.setAttribute("font-size", "9");
        valTxt.setAttribute("fill", "var(--rain)");
        valTxt.setAttribute("font-weight", "700");
        valTxt.textContent = mm.toFixed(1);
        barsGroup.appendChild(valTxt);
      }
      const ltxt = document.createElementNS(SVG_NS, "text");
      ltxt.setAttribute("x", String(x + w / 2));
      ltxt.setAttribute("y", String(CHART_BASE_Y + 14));
      ltxt.setAttribute("text-anchor", "middle");
      ltxt.setAttribute("font-size", "11");
      ltxt.setAttribute("fill", "var(--muted)");
      ltxt.textContent = label;
      labelsGroup.appendChild(ltxt);
    }
  }
  function renderDetails() {
    var _a, _b;
    const c = weatherData.current;
    const h = weatherData.hourly;
    if (!c) return;
    $("detail-wind").textContent = `${Math.round(c.wind_speed_10m)}`;
    $("detail-wind-label").textContent = t().windLabel;
    $("detail-humidity-label").textContent = t().humidityLabel;
    $("detail-uv-label").textContent = t().uvLabel;
    if (h) {
      const nowIdx = hourlyIndexAt(h.time, 0);
      $("detail-humidity").textContent = `${Math.round((_a = h.relative_humidity_2m[nowIdx]) != null ? _a : 0)}%`;
      $("detail-uv").textContent = ((_b = h.uv_index[nowIdx]) != null ? _b : 0).toFixed(1);
    }
  }
  function setRefreshLoading(on) {
    const btn = $("refresh-btn");
    if (on) {
      btn.classList.add("loading");
      $("refresh-btn-label").textContent = t().refreshing;
    } else {
      btn.classList.remove("loading");
      $("refresh-btn-label").textContent = t().refresh;
    }
  }
  function hideLoadingOverlay() {
    const ol = $("loading-overlay");
    ol.classList.add("hidden");
    setTimeout(() => {
      if (ol.parentNode) ol.parentNode.removeChild(ol);
    }, 500);
  }
  function showFetchError() {
    const dot = $("loc-dot");
    const status = $("loc-status");
    status.textContent = t().fetchErr;
    status.className = "status-text err";
    if ($("loading-overlay") && !$("loading-overlay").classList.contains("hidden")) {
      $("loading-msg").textContent = t().fetchErr;
    }
  }
  function updateLastUpdated() {
    if (!lastFetchAt) {
      $("last-updated").textContent = "";
      return;
    }
    const diffMin = Math.round((Date.now() - lastFetchAt.getTime()) / 6e4);
    const s = diffMin <= 0 ? locale === "ar" ? "\u0627\u0644\u0622\u0646" : "just now" : `${diffMin} min ago`;
    $("last-updated").textContent = t().lastUpdated(s);
  }
  function renderLocationStatus() {
    const dot = $("loc-dot");
    const status = $("loc-status");
    status.className = "status-text";
    if (coordsSource === "live" && coords) {
      dot.className = "dot live";
      status.textContent = t().locOk(
        `${coords.lat.toFixed(3)}\xB0, ${coords.lng.toFixed(3)}\xB0`
      );
    } else if (coordsSource === "denied") {
      dot.className = "dot";
      status.className = "status-text warn";
      status.textContent = t().locDenied;
    } else {
      dot.className = "dot";
      status.textContent = t().locFallback;
    }
  }
  function renderHeader() {
    document.documentElement.lang = locale === "ar" ? "ar" : "en";
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    $("city-name").textContent = t().title;
    $("refresh-btn-label").textContent = t().refresh;
  }
  function applyTheme(isDark) {
    document.body.dataset.theme = isDark ? "dark" : "light";
  }
  function applyLocation(snapshot) {
    if (!snapshot || typeof snapshot.lat !== "number") return;
    coords = { lat: snapshot.lat, lng: snapshot.lng };
    coordsSource = "live";
    renderLocationStatus();
    const now = Date.now();
    if (now - lastLocationChangeAt < LOCATION_DEBOUNCE_MS && weatherData) return;
    lastLocationChangeAt = now;
    fetchWeather(coords.lat, coords.lng);
  }
  async function main() {
    let client;
    try {
      client = MiniAppClient.fromWindow();
    } catch (e) {
      if (e instanceof NotInsideHostError) {
        console.warn("Running outside host \u2014 using fallback location.");
        coordsSource = "fallback";
        coords = { lat: 24.774265, lng: 46.738586 };
        renderHeader();
        renderLocationStatus();
        fetchWeather(coords.lat, coords.lng);
        return;
      }
      throw e;
    }
    try {
      const ctx = await client.getContext();
      locale = ctx.locale && ctx.locale.startsWith("ar") ? "ar" : "en";
      applyTheme(!!ctx.isDark);
    } catch (e) {
      console.warn("getContext failed; defaulting to en + light", e);
    }
    renderHeader();
    $("loading-msg").textContent = t().locating;
    try {
      const initial = await getLocationSnapshot();
      applyLocation(initial);
      watchLocation(applyLocation);
    } catch (e) {
      if (e instanceof LocationUnavailableError) {
        coordsSource = "denied";
        renderLocationStatus();
        console.info("Location denied \u2014 no fallback in host mode.");
      } else {
        console.error("Location bridge error:", e);
        coordsSource = "fallback";
        coords = { lat: 24.774265, lng: 46.738586 };
        renderLocationStatus();
        fetchWeather(coords.lat, coords.lng);
      }
    }
    $("refresh-btn").addEventListener("click", () => {
      if (coords) {
        lastLocationChangeAt = 0;
        fetchWeather(coords.lat, coords.lng);
      }
    });
    setInterval(updateLastUpdated, 3e4);
  }
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && coords) {
      const stale = !lastFetchAt || Date.now() - lastFetchAt.getTime() > LOCATION_DEBOUNCE_MS;
      if (stale) fetchWeather(coords.lat, coords.lng);
    }
  });
  main().catch((e) => {
    console.error("Fatal mini-app error:", e);
    const lm = $("loading-msg");
    if (lm) lm.textContent = "Something went wrong \u2014 see console.";
  });
})();
