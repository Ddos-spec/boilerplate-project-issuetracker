const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

let issueId1; // Untuk menyimpan _id dari tes POST pertama
let issueId2; // Untuk menyimpan _id dari tes POST kedua

suite('Functional Tests', function() {
  
    suite('POST /api/issues/{project}', function() {
      
      test('Create an issue with every field', function(done) {
        chai.request(server)
          .post('/api/issues/test')
          .send({
            issue_title: 'Fix error in posting data',
            issue_text: 'When we post data it has an error.',
            created_by: 'Joe',
            assigned_to: 'Joe',
            status_text: 'In QA'
          })
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.equal(res.body.issue_title, 'Fix error in posting data');
            assert.equal(res.body.issue_text, 'When we post data it has an error.');
            assert.equal(res.body.created_by, 'Joe');
            assert.equal(res.body.assigned_to, 'Joe');
            assert.equal(res.body.status_text, 'In QA');
            assert.isTrue(res.body.open);
            assert.property(res.body, '_id');
            issueId1 = res.body._id; // Simpan _id untuk tes selanjutnya
            done();
          });
      });
      
      test('Create an issue with only required fields', function(done) {
        chai.request(server)
          .post('/api/issues/test')
          .send({
            issue_title: 'Required Fields Only',
            issue_text: 'This is a test with only required fields.',
            created_by: 'Jane'
          })
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.equal(res.body.issue_title, 'Required Fields Only');
            assert.equal(res.body.issue_text, 'This is a test with only required fields.');
            assert.equal(res.body.created_by, 'Jane');
            assert.equal(res.body.assigned_to, '');
            assert.equal(res.body.status_text, '');
            assert.isTrue(res.body.open);
            issueId2 = res.body._id; // Simpan _id untuk tes selanjutnya
            done();
          });
      });
      
      test('Create an issue with missing required fields', function(done) {
        chai.request(server)
          .post('/api/issues/test')
          .send({
            issue_title: 'Missing required fields'
          })
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.deepEqual(res.body, { error: 'required field(s) missing' });
            done();
          });
      });
      
    });

    suite('GET /api/issues/{project}', function() {

      test('View issues on a project', function(done) {
        chai.request(server)
          .get('/api/issues/test')
          .query({})
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.isArray(res.body);
            assert.property(res.body[0], 'issue_title');
            assert.property(res.body[0], 'issue_text');
            assert.property(res.body[0], 'created_on');
            assert.property(res.body[0], 'updated_on');
            assert.property(res.body[0], 'created_by');
            assert.property(res.body[0], 'assigned_to');
            assert.property(res.body[0], 'open');
            assert.property(res.body[0], 'status_text');
            assert.property(res.body[0], '_id');
            done();
          });
      });

      test('View issues on a project with one filter', function(done) {
        chai.request(server)
          .get('/api/issues/test')
          .query({created_by: 'Joe'})
          .end(function(err, res){
            assert.equal(res.status, 200);
            res.body.forEach(issue => {
              assert.equal(issue.created_by, 'Joe');
            });
            done();
          });
      });

      test('View issues on a project with multiple filters', function(done) {
        chai.request(server)
          .get('/api/issues/test')
          .query({open: true, created_by: 'Jane'})
          .end(function(err, res){
            assert.equal(res.status, 200);
            res.body.forEach(issue => {
              assert.isTrue(issue.open);
              assert.equal(issue.created_by, 'Jane');
            });
            done();
          });
      });
    });

    suite('PUT /api/issues/{project}', function() {
      
      test('Update one field on an issue', function(done) {
        chai.request(server)
          .put('/api/issues/test')
          .send({
            _id: issueId1,
            issue_text: 'This text has been updated'
          })
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.deepEqual(res.body, { result: 'successfully updated', '_id': issueId1 });
            done();
          });
      });

      test('Update multiple fields on an issue', function(done) {
        chai.request(server)
          .put('/api/issues/test')
          .send({
            _id: issueId2,
            issue_title: 'Updated Title',
            issue_text: 'Updated text for multiple fields test',
            open: 'false'
          })
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.deepEqual(res.body, { result: 'successfully updated', '_id': issueId2 });
            done();
          });
      });

      test('Update an issue with missing _id', function(done) {
        chai.request(server)
          .put('/api/issues/test')
          .send({
            issue_title: 'No ID here'
          })
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.deepEqual(res.body, { error: 'missing _id' });
            done();
          });
      });

      test('Update an issue with no fields to update', function(done) {
        chai.request(server)
          .put('/api/issues/test')
          .send({
            _id: issueId1
          })
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.deepEqual(res.body, { error: 'no update field(s) sent', '_id': issueId1 });
            done();
          });
      });

      test('Update an issue with an invalid _id', function(done) {
        chai.request(server)
          .put('/api/issues/test')
          .send({
            _id: 'invalid_id_format',
            issue_title: 'Trying to update with invalid ID'
          })
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.deepEqual(res.body, { error: 'could not update', '_id': 'invalid_id_format' });
            done();
          });
      });
    });

    suite('DELETE /api/issues/{project}', function() {
      
      test('Delete an issue', function(done) {
        chai.request(server)
          .delete('/api/issues/test')
          .send({
            _id: issueId1 // Hapus issue yang dibuat di tes pertama
          })
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.deepEqual(res.body, { result: 'successfully deleted', '_id': issueId1 });
            done();
          });
      });

      test('Delete an issue with an invalid _id', function(done) {
        chai.request(server)
          .delete('/api/issues/test')
          .send({
            _id: 'invalid_id_format_again'
          })
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.deepEqual(res.body, { error: 'could not delete', '_id': 'invalid_id_format_again' });
            done();
          });
      });

      test('Delete an issue with missing _id', function(done) {
        chai.request(server)
          .delete('/api/issues/test')
          .send({})
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.deepEqual(res.body, { error: 'missing _id' });
            done();
          });
      });
    });

});
