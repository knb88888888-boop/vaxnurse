// Skrypt ekstrakcji stron urzędowego dokumentu PSO 2027 (akt.pdf)
import fs from 'fs';
import path from 'path';

if (!Promise.try) {
  Promise.try = function (fn, ...args) {
    return new Promise((resolve) => resolve(fn(...args)));
  };
}

async function extractAllPages() {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const pdfPath = path.resolve('akt.pdf');
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  
  const doc = await pdfjs.getDocument({
    data,
    isEvalSupported: false,
    disableFontFace: true,
  }).promise;

  console.log(`Załadowano dokument akt.pdf: ${doc.numPages} stron.`);
  const pages = [];

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    // Grupujemy elementy tekstu według pozycji pionowej Y (linie tekstu)
    const items = textContent.items.map((item) => ({
      str: item.str,
      x: item.transform[4],
      y: item.transform[5],
      width: item.width,
      height: item.height,
    }));

    // Sortujemy linie od góry do dołu, a w linii od lewej do prawej
    items.sort((a, b) => {
      const yDiff = b.y - a.y;
      if (Math.abs(yDiff) > 3) return yDiff;
      return a.x - b.x;
    });

    // Składamy w czytelne linie
    const lines = [];
    let currentLine = [];
    let currentY = null;

    for (const item of items) {
      if (item.str === '') continue;
      if (currentY === null || Math.abs(item.y - currentY) <= 3) {
        currentLine.push(item.str);
        if (currentY === null) currentY = item.y;
      } else {
        lines.push(currentLine.join(' '));
        currentLine = [item.str];
        currentY = item.y;
      }
    }
    if (currentLine.length > 0) {
      lines.push(currentLine.join(' '));
    }

    const fullText = lines.join('\n');
    pages.push({
      pageNumber: pageNum,
      linesCount: lines.length,
      lines,
      fullText,
    });
  }

  const outDir = path.resolve('.cache');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outPath = path.join(outDir, 'akt_pso_2027_extracted.json');
  fs.writeFileSync(outPath, JSON.stringify(pages, null, 2), 'utf8');
  console.log(`Wyekstrahowano ${pages.length} stron do: ${outPath}`);
}

extractAllPages().catch((err) => {
  console.error('Błąd ekstrakcji:', err);
  process.exit(1);
});
