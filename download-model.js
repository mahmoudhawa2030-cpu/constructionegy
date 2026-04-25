const https = require('https');
const fs = require('fs');

// Try multiple sources
const sources = [
  'https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n_float16.tflite',
  'https://media.githubusercontent.com/media/ultralytics/assets/main/yolov8n_float16.tflite',
];

function tryDownload(index = 0) {
  if (index >= sources.length) {
    console.error('All sources failed.');
    console.log('\nAlternative: Install TensorFlow and export locally:');
    console.log('  pip install tensorflow ultralytics');
    console.log('  python -c "from ultralytics import YOLO; YOLO(\'yolov8n\').export(format=\'tflite\')"');
    return;
  }

  const url = sources[index];
  console.log(`\nTrying source ${index + 1}/${sources.length}: ${url}`);
  
  const file = fs.createWriteStream('public/models/yolo12n/yolov8n_float16.tflite');
  
  https.get(url, { 
    headers: { 'User-Agent': 'Mozilla/5.0' },
    timeout: 30000
  }, (res) => {
    console.log('Status:', res.statusCode);
    
    if (res.statusCode === 200) {
      let downloaded = 0;
      res.on('data', (chunk) => {
        downloaded += chunk.length;
        process.stdout.write(`Downloaded: ${(downloaded / 1024 / 1024).toFixed(2)} MB\r`);
      });
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log('\nDownload complete!');
      });
    } else if (res.statusCode === 302 || res.statusCode === 301) {
      console.log('Redirect detected, trying next source...');
      tryDownload(index + 1);
    } else {
      console.error('Failed, trying next source...');
      tryDownload(index + 1);
    }
  }).on('error', (err) => {
    console.error('Error:', err.message);
    tryDownload(index + 1);
  });
}

tryDownload();
