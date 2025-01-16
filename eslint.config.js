import typescriptEslint from "@typescript-eslint/eslint-plugin";
import antiTrojanSource from "eslint-plugin-anti-trojan-source";
import jsdoc from "eslint-plugin-jsdoc";
import n from "eslint-plugin-n";
import optimizeRegex from "eslint-plugin-optimize-regex";
import security from "eslint-plugin-security";
import xss from "eslint-plugin-xss";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [
    n.configs["flat/recommended-script"],
    jsdoc.configs['flat/recommended-typescript-flavor'],
    security.configs.recommended,
    // typescriptEslint.configs.recommendedTypeChecked,
    {
    ignores: [
        "**/.nyc_output",
        "**/convert",
        "**/coverage",
        "**/node_modules",
        "dist/*",
        "site/themes/*",
        "eslint.config.js",
    ],
}, ...compat.extends(
    "plugin:optimize-regex/all",
), {
    plugins: {
        "@typescript-eslint": typescriptEslint,
        "anti-trojan-source": antiTrojanSource,
        "optimize-regex": optimizeRegex,
        xss,
    },

    languageOptions: {
        globals: {
            ...globals.browser,
            ...globals.node,
            sinon: false,
            expect: true,
        },

        parser: tsParser,
        ecmaVersion: "latest",
        sourceType: "module",

        parserOptions: {
            project: true,
            requireConfigFile: false,
            tsconfigRootDir: import.meta.dirname,
        },
    },

    settings: {
        jsdoc: {
            mode: "typescript",
        },

        react: {
            version: "detect",
        },
    },

    rules: {
        "@typescript-eslint/no-unsafe-argument": "warn",
        "@typescript-eslint/no-unsafe-assignment": "warn",
        "@typescript-eslint/no-unsafe-call": "warn",
        "@typescript-eslint/no-unsafe-member-access": "warn",
        "@typescript-eslint/no-unsafe-return": "warn",
        "@typescript-eslint/no-unused-vars": ["error", {
            varsIgnorePattern: "^_",
            argsIgnorePattern: "^_",
            caughtErrors: "none",
        }],

        "anti-trojan-source/no-bidi": "error",
        camelcase: 0,

        "consistent-return": ["warn", {
            treatUndefinedAsUnspecified: false,
        }],
        "jsdoc/no-undefined-types": 1,

        "no-empty": ["error", {
            allowEmptyCatch: true,
        }],

        "no-param-reassign": 0,
        "no-plusplus": 0,

        "no-restricted-syntax": ["error", {
            selector: "ForInStatement",
            message: "for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.",
        }, {
            selector: "LabeledStatement",
            message: "Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.",
        }, {
            selector: "WithStatement",
            message: "`with` is disallowed in strict mode because it makes code impossible to predict and optimize.",
        }],

        "no-underscore-dangle": 0,

        "no-unused-vars": 0,

        "n/no-missing-import": ["error", {
            allowModules: ["ava"],
        }],

        "n/no-unsupported-features/es-syntax": ["error", {
            ignores: ["modules", "dynamicImport"],
        }],

        "optimize-regex/optimize-regex": "warn",
        "security/detect-non-literal-fs-filename": 0,
        "security/detect-non-literal-require": 0,
        "security/detect-object-injection": 0,
    },
}];
