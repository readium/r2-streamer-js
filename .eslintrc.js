module.exports = {
    parser: "@typescript-eslint/parser",
    env: {
        node: true,
        browser: true,
        es6: true,
        es2020: true,
    },
    parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
        ecmaVersion: 2020,
        sourceType: "module",
        ecmaFeatures: {
            jsx: true,
        },
    },
    extends: ["plugin:@typescript-eslint/recommended-type-checked", "prettier", "plugin:prettier/recommended"],
    plugins: [
        // "unused-imports",
        "prettier",
    ],
    rules: {
        quotes: ["error", "double"],
        "comma-dangle": ["error", "always-multiline"],
        "eol-last": ["error", "always"],
        semi: ["error", "always"],

        "@typescript-eslint/no-unsafe-member-access": 0,
        "@typescript-eslint/no-unsafe-return": 0,
        "@typescript-eslint/no-unsafe-assignment": 0,
        "@typescript-eslint/no-unsafe-call": 0,
        "@typescript-eslint/no-unsafe-argument": 0,
        "@typescript-eslint/no-unnecessary-type-assertion": 0,
        "@typescript-eslint/restrict-template-expressions": 0,
        "@typescript-eslint/no-redundant-type-constituents": 0,
        "@typescript-eslint/no-base-to-string": 0,
        "@typescript-eslint/no-misused-promises": 0,
        "@typescript-eslint/require-await": 0,
        "@typescript-eslint/no-floating-promises": 0,
        "@typescript-eslint/unbound-method": 0,

        "@typescript-eslint/no-unsafe-enum-comparison": 0,
        "@typescript-eslint/restrict-plus-operands": 0,

        "no-unused-vars": 0,
        // "@typescript-eslint/no-unused-vars": 0,
        "@typescript-eslint/no-unused-vars": [
            "error",
            {
                vars: "all",
                args: "all",
                argsIgnorePattern: "^_",
                varsIgnorePattern: "^_",
                caughtErrorsIgnorePattern: "^_",
                caughtErrors: "all",
            },
        ],
        // "unused-imports/no-unused-imports": "error",
        // "unused-imports/no-unused-vars": [
        //     "error",
        //     {
        //         vars: "all",
        //         args: "all",
        //         argsIgnorePattern: "^_",
        //         varsIgnorePattern: "^_",
        //         caughtErrorsIgnorePattern: "^_",
        //         caughtErrors: "all",
        //     },
        // ],

        // TODO ({} used as anonymous / generic object type)
        // "@typescript-eslint/ban-types": 0,

        // TODO (many any!!)
        // "@typescript-eslint/no-explicit-any": 0,

        // TODO (missing return types on functions)
        "@typescript-eslint/explicit-module-boundary-types": 0,
        // "@typescript-eslint/explicit-module-boundary-types": [
        //     "error",
        //     {
        //         allowArgumentsExplicitlyTypedAsAny: true,
        //         allowDirectConstAssertionInArrowFunctions: true,
        //         allowedNames: [],
        //         allowHigherOrderFunctions: true,
        //         allowTypedFunctionExpressions: true,
        //     },
        // ],

        // "@typescript-eslint/explicit-function-return-type": 0,
        // "@typescript-eslint/explicit-function-return-type": [
        //     "error",
        //     {
        //         allowExpressions: true,
        //         allowTypedFunctionExpressions: true,
        //     },
        // ],

        "prettier/prettier": "error",
    },
    // overrides: [
    //     {
    //         files: ["*.ts", "*.tsx"],
    //         rules: {
    //             "@typescript-eslint/explicit-function-return-type": [
    //                 "error",
    //                 {
    //                     allowExpressions: true,
    //                 },
    //             ],
    //         },
    //     },
    // ],
};
