const entity = require('../biz/Projects')

const list = () => {
  return entity.search({})
      .then(function (list) {
          return {
              items: list
          }
      })
}

module.exports = {
  url: '/jingyin/rests/manjusri/projects',
  rests: [{
      type: 'create',
      target: 'Project',
      handler: (req) => {
        return entity.create(req.body)
      }
    },
    {
      type: 'query',
      element: 'Project',
      handler: list
    }
  ]
}