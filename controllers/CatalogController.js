const catalogModel = require('../models/Catalog');

function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&' + 'amp;')
    .replace(/</g, '&' + 'lt;')
    .replace(/>/g, '&' + 'gt;')
    .replace(/"/g, '&' + 'quot;')
    .replace(/'/g, '&' + '#x27;')
    .replace(/\//g, '&' + '#x2F;');
}

class CatalogController {
  async getAll(req, res) {
    try {
      const catalogs = await catalogModel.getAll();
      res.status(200).json(catalogs);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Sunucu hatası oluştu.' });
    }
  }

  async create(req, res) {
    try {
      let { name, description, verticalImage, horizontalImage } = req.body;

      // Extract uploaded files if they exist from multer
      if (req.files) {
        if (req.files['verticalImage'] && req.files['verticalImage'][0]) {
          verticalImage = req.files['verticalImage'][0].filename;
        }
        if (req.files['horizontalImage'] && req.files['horizontalImage'][0]) {
          horizontalImage = req.files['horizontalImage'][0].filename;
        }
      }

      if (!name || !description || !verticalImage || !horizontalImage) {
        return res.status(400).json({
          message: 'Lütfen tüm alanları doldurun (name, description, verticalImage, horizontalImage).'
        });
      }

      // Sanitize fields against XSS since they might have come from multipart form-data
      const sanitizedName = sanitizeString(name);
      const sanitizedDesc = sanitizeString(description);

      const newCatalog = await catalogModel.create({
        name: sanitizedName,
        description: sanitizedDesc,
        verticalImage,
        horizontalImage
      });

      res.status(201).json({
        message: 'Katalog öğesi başarıyla eklendi.',
        catalog: newCatalog
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Sunucu hatası oluştu.' });
    }
  }
}

module.exports = new CatalogController();
