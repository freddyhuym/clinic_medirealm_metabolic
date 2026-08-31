var APPOINTMENT_TREATMENTS = [
  { id: 'pico-dark-spot', name: '黑斑皮秒雷射', price: 3999 },
  { id: 'pico-honeycomb', name: '蜂巢皮秒雷射', price: 6999 },
  { id: 'pico-gold-tip', name: '黃金探頭皮秒雷射', price: 4999 },
  { id: 'qplus-z-ultrasound', name: 'Q+ 及 Z 音波', price: 26800 },
  { id: 'embody', name: '電磁波增肌減脂 EmBody', price: 1999 },
  { id: 'ipl-hair-removal', name: '海神脈衝光除毛', optionsMode: 'multiple', options: [
    { id: 'underarm', name: '腋下', price: 1999 },
    { id: 'vio', name: 'VIO', price: 3999 },
    { id: 'calf', name: '小腿', price: 4999 },
    { id: 'half-arm', name: '半臂', price: 4999 },
    { id: 'beard', name: '鬍子', price: 4599 }
  ]},
  { id: 'water-ultrasound', name: '水音波體驗', price: 2999 },
  { id: 'wellspa', name: 'Wellspa 體驗', price: 1999 },
  { id: 'hydrafacial-men', name: '男士控油淨膚｜海菲秀', price: 4999 },
  { id: 'botox-wrinkle', name: '肉毒桿菌除皺', optionsMode: 'single', options: [
    { id: 'slim-face', name: '小臉', price: 8999 },
    { id: 'three-areas', name: '三部位', price: 8999 }
  ]},
  { id: 'microneedling-scar', name: '毛孔痘疤療程（微針）', price: 9999 },
  { id: 'body-sculpting', name: '體態雕塑療程（增肌減脂）', price: 1999 },
  { id: 'unsure', name: '其他療程／還不確定', description: '想先由專人協助評估' }
];
if (typeof module !== 'undefined' && module.exports) module.exports = APPOINTMENT_TREATMENTS;
else window.APPOINTMENT_TREATMENTS = APPOINTMENT_TREATMENTS;