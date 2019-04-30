const __ = require('underscore')

const lamping = {
  type: 'lamping',
  summary: '供灯之功德总述-from server',
  title: '供灯祈福',
  items: [{
      img: '/static/img/lamps.jpg',
      name: '长明灯',
      price: 365,
      desc: '2019年365天整年在佛前供灯1盏',
      num: 3023
    },
    {
      name: '长明灯',
      price: 1095,
      desc: '2019年365天整年在佛前供灯3盏',
      num: 1000
    },
    {
      name: '除障灯',
      price: 200,
      desc: '愿众生消除障碍违缘',
      num: 30000
    },
    {
      name: '吉祥灯',
      price: 100,
      desc: '祈祷家庭和睦，婚缘顺意',
      num: 5000
    }
  ]
}

const formonks = {
  type: 'formonks',
  summary: '供僧的功德总述-from server',
  title: '随喜供斋僧位',
  items: [{
      img: '/static/img/img_gongxiu_2.jpg',
      name: '方丈位',
      price: 88888,
      target: 88888,
      amount: 33333,
      desc: '寺院方丈过斋时坐的位置，仅1个，认供完截止',
      num: 10000
    },
    {
      name: '僧位',
      price: 6666000,
      target: 6666000,
      amount: 5333300,
      desc: '出家僧众过斋的位置，共1000个僧位',
      num: 20000
    },
    {
      name: '随喜供斋',
      price: 88,
      desc: '出家僧众供斋',
      num: 30000
    }
  ]
}

const onlines = {
  lamping,
  formonks
}

const handler = function (req, res) {
  if (req.session.user) {
    req.session.user.isVisit++;
  } else {
    req.session.user = {
      isVisit: 1
    }
    console.log('first set session user: ' + JSON.stringify(req.session, null, 2));
  }
  
  onlines.lamping.items = __.map(onlines.lamping.items, item => {
    return {
      ...item,
      img: item.img || '/static/img/lamps.jpg'
    }
  })
  onlines.formonks.items = __.map(onlines.formonks.items, item => {
    return {
      ...item,
      img: item.img || '/static/img/img_gongxiu_2.jpg'
    }
  })
  return Promise.resolve(onlines)
};

module.exports = {
  url: '/jingyin/rests/manjusri/onlines/index',
  rests: [{
    type: 'http',
    method: 'get',
    // type: 'get',
    handler: handler
  }]
}