import { createWorker } from "tesseract.js";
import fs from 'fs/promises'
import { select, input } from '@inquirer/prompts';
import { exit } from "process";
import path from "path";
import chalk from "chalk";

const limpiarRuta = (rutaSucia) => {
    return rutaSucia.replace(/['"]+/g, '').trim();
};

async function rutaFolder(nombreImg) {
    try {
        const folder = await input({
            message: chalk.blue('📂 Arrastra la carpeta donde guardar el .txt aquí:')
        });
        const rutaLimpia = limpiarRuta(folder);
        await fs.access(rutaLimpia);

        return path.join(rutaLimpia, `${nombreImg}.txt`);
    } catch (e) {
        console.error(chalk.red(`Carpeta no válida o inaccesible.`));
        exit()
    }
}

async function rutaImg() {
    try {
        const ruta = await input({
            message: chalk.blue('Arrastra tu imagen aquí y presiona Enter:')
        });
        const rutaLimpia = limpiarRuta(ruta);
        await fs.access(rutaLimpia);
        return rutaLimpia;
    } catch (e) {
        console.error(chalk.red(`No se pudo encontrar la imagen.`));
        return null;
    }
}

async function LeerImg(idioma, img) {
    let worker;
    try {
        console.log(chalk.yellow('\n  Inicializando motor de lectura...'));
        worker = await createWorker(idioma);

        const { data } = await worker.recognize(img);

        console.log(chalk.green('\n✅ Texto detectado con éxito:'));
        console.log(`\n  ${data.text}`);

        const nombreSinExtension = path.parse(img).name;
        const pathDestino = await rutaFolder(nombreSinExtension);

        if (pathDestino) {
            await fs.writeFile(pathDestino, data.text);
            console.log(chalk.green(`\n ✨ ¡ÉXITO! Guardado en: ${pathDestino} `));
        }

    } catch (error) {
        console.error(chalk.red(` Error en el proceso OCR: ${error.message}`));
    } finally {
        if (worker) await worker.terminate();
    }
}

async function main() {
    console.log(chalk.magenta.bold('\n--- 📝 EXTRACTOR DE TEXTO v1.0 ---'));
    console.log(chalk.dim('Convierte tus imágenes a texto en segundos\n'));

    try {
        const idioma = await select({
            message: chalk.blue("Selecciona el idioma del texto:"),
            choices: [
                { name: "Español", value: "spa" },
                { name: "Inglés", value: "eng" },
                { name: "Chino Mandarín", value: "chi_sim" },
                { name: "Salir", value: "salir" }
            ]
        });

        if (idioma === "salir") {
            console.log(chalk.green('¡Hasta luego ✋ !'));
            exit();
        }

        const rutaImagen = await rutaImg();
        if (rutaImagen) {
            await LeerImg(idioma, rutaImagen);
        }

    } catch (error) {
        console.log(chalk.red(`\n Error crítico en ejecución: ${error}`));
    }
}
(async () => {
    await main();
})();
