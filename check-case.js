const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const srcDir = path.join(projectRoot, 'src');

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') {
        getAllFiles(filePath, fileList);
      }
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

function checkImports() {
  const files = getAllFiles(srcDir);
  let hasErrors = false;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const importRegex = /import.*?from\s+['"]([^'"]+)['"]/g;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      if (importPath.startsWith('.') || importPath.startsWith('..')) {
        const absoluteImportPath = path.resolve(path.dirname(file), importPath);
        
        // Find the exact filename on disk
        const dirName = path.dirname(absoluteImportPath);
        const baseName = path.basename(absoluteImportPath);

        if (fs.existsSync(dirName)) {
          const filesInDir = fs.readdirSync(dirName);
          
          // Next.js resolves extensions automatically
          const matchedFile = filesInDir.find(f => {
             const fNoExt = f.replace(/\.[^/.]+$/, "");
             return fNoExt.toLowerCase() === baseName.toLowerCase() || f.toLowerCase() === baseName.toLowerCase();
          });

          if (matchedFile) {
            const matchedFileNoExt = matchedFile.replace(/\.[^/.]+$/, "");
            if (matchedFile !== baseName && matchedFileNoExt !== baseName) {
              console.log(`\n❌ Case mismatch in ${path.relative(projectRoot, file)}`);
              console.log(`   Imported as: '${importPath}'`);
              console.log(`   Actual file: '${matchedFile}'`);
              hasErrors = true;
            }
          }
        }
      }
    }
  }
  
  if (!hasErrors) {
    console.log("✅ No case-sensitive import issues found.");
  }
}

checkImports();
