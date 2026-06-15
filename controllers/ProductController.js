const productModel = require('../models/Product');

class ProductController {
  async getAll(req, res) {
    try {
      const filters = {};
      if (req.query.isPublished !== undefined) filters.isPublished = req.query.isPublished === 'true' || req.query.isPublished === '1';

      const products = await productModel.getAll(filters);
      res.status(200).json(products);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Sunucu hatası oluştu.' });
    }
  }

  async create(req, res) {
    try {
      let { title, description, price, priceString, image, duration, durationSeconds, orderIndex, isPublished, category, catColor, stories, ages, pages, externalUrl, isAvailable } = req.body;
      if (req.file) {
        image = `https://cdn.biblecms.com/images/${req.file.filename}`;
      }
      if (!title || price === undefined || !image) {
        return res.status(400).json({ message: 'Lütfen tüm zorunlu alanları doldurun (title, price, image).' });
      }

      const newProduct = await productModel.create({
        title,
        category: category || 'Default Category',
        catColor: catColor || '#9747ff',
        image,
        stories: stories || '',
        ages: ages || '',
        pages: pages || '',
        price: parseFloat(price),
        externalUrl: externalUrl || '',
        isAvailable: isAvailable === undefined ? true : (isAvailable === 'true' || isAvailable === 1 || isAvailable === true),
        orderIndex: orderIndex ? parseInt(orderIndex) : 0
      });

      res.status(201).json({
        message: 'Ürün başarıyla eklendi.',
        product: newProduct
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Sunucu hatası oluştu.' });
    }
  }

  async update(req, res) {
    try {
      let { title, description, price, priceString, image, duration, durationSeconds, orderIndex, isPublished, category, catColor, stories, ages, pages, externalUrl, isAvailable } = req.body;
      if (req.file) {
        image = `https://cdn.biblecms.com/images/${req.file.filename}`;
      }
      const updated = await productModel.update(req.params.id, {
        title,
        category,
        catColor,
        image,
        stories,
        ages,
        pages,
        price: price !== undefined ? parseFloat(price) : undefined,
        externalUrl,
        isAvailable: isAvailable === undefined ? undefined : (isAvailable === 'true' || isAvailable === 1 || isAvailable === true),
        orderIndex: orderIndex !== undefined ? parseInt(orderIndex) : undefined
      });

      if (!updated) {
        return res.status(404).json({ message: 'Ürün bulunamadı.' });
      }

      res.json({
        message: 'Ürün başarıyla güncellendi.',
        product: updated
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Sunucu hatası oluştu.' });
    }
  }

  async delete(req, res) {
    try {
      const success = await productModel.delete(req.params.id);
      if (!success) {
        return res.status(404).json({ message: 'Ürün bulunamadı.' });
      }
      res.json({ message: 'Ürün başarıyla silindi.' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Sunucu hatası oluştu.' });
    }
  }
}

module.exports = new ProductController();
