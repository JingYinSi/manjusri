describe('业务逻辑', () => {
    beforeEach((done) => {
        return clearDB(done);
    })

    it('virtueType', () => {
        const entity = require('../server/biz/VirtueTypes')
        return entity.create({
            "project": "5cbd5c1728b855139877ef79",
            "name": "12346",
            "desc": "virtue name fee desc"
          })
          .then((data)=>{
              expect(data).not.null
          })
          .catch((err) => {
              should.fail('fail')
          })
    })
})