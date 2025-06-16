'use strict';
const { ObjectId } = require('mongodb');

module.exports = function (app, db) {

  app.route('/api/issues/:project')
  
    .get(async function (req, res){
      let project = req.params.project;
      let query = req.query;
      
      // Jika ada filter _id, konversi ke ObjectId
      if (query._id) {
        query._id = new ObjectId(query._id);
      }
      // Konversi filter 'open' dari string ke boolean
      if (query.open) {
        query.open = query.open === 'true';
      }

      try {
        const issues = await db.collection(project).find(query).toArray();
        res.json(issues);
      } catch (error) {
        res.status(500).json({ error: 'database query failed' });
      }
    })
    
    .post(async function (req, res){
      let project = req.params.project;
      const { issue_title, issue_text, created_by, assigned_to, status_text } = req.body;

      // Cek field yang wajib diisi
      if (!issue_title || !issue_text || !created_by) {
        return res.json({ error: 'required field(s) missing' });
      }

      const newIssue = {
        issue_title: issue_title,
        issue_text: issue_text,
        created_by: created_by,
        assigned_to: assigned_to || '',
        status_text: status_text || '',
        created_on: new Date(),
        updated_on: new Date(),
        open: true
      };

      try {
        const result = await db.collection(project).insertOne(newIssue);
        // Ambil dokumen yang baru saja dibuat untuk dikembalikan
        const createdIssue = await db.collection(project).findOne({ _id: result.insertedId });
        res.json(createdIssue);
      } catch (error) {
        res.status(500).json({ error: 'could not create issue' });
      }
    })
    
    .put(async function (req, res){
      let project = req.params.project;
      const { _id, ...updateFields } = req.body;

      // Cek apakah _id dikirim
      if (!_id) {
        return res.json({ error: 'missing _id' });
      }

      // Cek apakah ada field yang mau di-update
      if (Object.keys(updateFields).length === 0) {
        return res.json({ error: 'no update field(s) sent', '_id': _id });
      }

      // Validasi _id
      if (!ObjectId.isValid(_id)) {
        return res.json({ error: 'could not update', '_id': _id });
      }
      
      const updateDoc = {
        $set: {
          ...updateFields,
          updated_on: new Date()
        }
      };

      try {
        const result = await db.collection(project).updateOne(
          { _id: new ObjectId(_id) },
          updateDoc
        );

        if (result.matchedCount === 0) {
          return res.json({ error: 'could not update', '_id': _id });
        }
        
        res.json({ result: 'successfully updated', '_id': _id });

      } catch (error) {
        res.json({ error: 'could not update', '_id': _id });
      }
    })
    
    .delete(async function (req, res){
      let project = req.params.project;
      const { _id } = req.body;

      // Cek apakah _id dikirim
      if (!_id) {
        return res.json({ error: 'missing _id' });
      }

      // Validasi _id
      if (!ObjectId.isValid(_id)) {
        return res.json({ error: 'could not delete', '_id': _id });
      }

      try {
        const result = await db.collection(project).deleteOne({ _id: new ObjectId(_id) });

        if (result.deletedCount === 0) {
          return res.json({ error: 'could not delete', '_id': _id });
        }

        res.json({ result: 'successfully deleted', '_id': _id });
      } catch (error) {
        res.json({ error: 'could not delete', '_id': _id });
      }
    });
    
};
