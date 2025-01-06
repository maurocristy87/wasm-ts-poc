import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
import dts from "rollup-plugin-dts";
import del from "rollup-plugin-del";
import wasm from "@rollup/plugin-wasm";

const builderECS = (format, filename) => ({
    exports: "named",
    name: "wasm-poc",
    file: "../lib/" + filename,
    format,
    sourcemap: true,
});

const main = () => {
    return [
        // this generates the modules
        {
            input: "src/index.ts",
            output: [
                builderECS("umd", "index.js"),
                builderECS("esm", "index.esm.js"),
                builderECS("cjs", "index.cjs.js"),
            ],
            plugins: [
                resolve({ browser: true, extensions: [".js", ".ts", ".wasm"] }),
                commonjs({ extensions: [".ts", ".js"] }),
                wasm({ targetEnv: "browser", maxFileSize: 1048576 }),
                typescript(),
                terser(),
            ],
        },
        // this generates one file containing all the type declarations
        {
            input: "../lib/types/index.d.ts",
            output: [
                {
                    file: "../lib/index.d.ts",
                    format: "es",
                },
            ],
            plugins: [dts(), del({ dest: "../lib/types" })],
        },
    ];
};

export default main();
