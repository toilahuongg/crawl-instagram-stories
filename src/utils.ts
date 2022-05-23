import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

export const readCookie = (name: string) => {
  if (!fs.existsSync(path.join(__dirname, 'cache', name))) return null;
  return JSON.parse(fs.readFileSync(path.join(__dirname, 'cache', name)).toString());
}

export const writeCookie = (name: string, data: string) => {
  fs.writeFileSync(path.join(__dirname, 'cache', name), data);
}

export const createFolder = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true, mode: '775' });
  }
};
const randomChars = function (length: number) {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i += 1) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

export const renameFile = (fileName: string) => {
  const fileObj = path.parse(fileName);
  const newName = fileObj.name
    .toLowerCase()
    .replace(' ', '-')
    .replace('_', '-')
    .replace('---', '-')
    .replace('--', '-')
    .replace(/[^a-z0-9\-]/g, '');

  return `${newName}-${randomChars(3)}${fileObj.ext}`;
};

export const downloadFile = (folder: string, uri: string): Promise<string> => new Promise(async (resolve, reject) =>{
  try {
    const response = await fetch(uri);
    const buffer = await response.buffer();
    const parsed = new URL(uri);
    const fileNameOrigin = renameFile(path.basename(parsed.pathname));
    const pathFile = `${folder}/${fileNameOrigin}`;
    fs.writeFileSync(pathFile, buffer);
    resolve(pathFile);
  } catch (error) {
    reject(error);
    console.log("Lỗi download");
  }
});

export const getOptionsFetch = (csrfToken: string) => {
  return ({
    "headers": {
      "accept": "*/*",
      "accept-language": "vi,en-US;q=0.9,en;q=0.8",
      "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"101\", \"Google Chrome\";v=\"101\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Windows\"",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "x-asbd-id": "198387",
      "x-csrftoken": csrfToken,
      "x-ig-app-id": "936619743392459",
      "x-requested-with": "XMLHttpRequest",
    },
    "referrer": "https://www.instagram.com/",
    "referrerPolicy": "strict-origin-when-cross-origin",
    "body": null,
    "method": "GET",
    "mode": "cors",
    "credentials": "include"
  })
}
