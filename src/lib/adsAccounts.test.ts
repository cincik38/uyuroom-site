import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  bookingConversionTargets,
  contactConversionTargets,
  googleTagPlan,
  isUsakContact,
  type AdsTrackingConfig,
} from './adsAccounts.ts';

const PRIMARY = 'AW-18301412707';
const USAK = 'AW-18579399747';

function cfg(extra: Partial<AdsTrackingConfig> = {}): AdsTrackingConfig {
  return {
    ga4: 'G-JBTHYBQRSY',
    ads: PRIMARY,
    adsBooking: 'NrO-CJy_k7QdEOvk2PVE',
    adsPhone: 'PG5NCO6bi7QdEOvk2PVE',
    adsWhatsapp: 'bvCbCNmbi7QdEOvk2PVE',
    adsUsak: '',
    adsUsakBooking: '',
    adsUsakPhone: '',
    adsUsakWhatsapp: '',
    pixel: '',
    ...extra,
  };
}

const both = cfg({
  adsUsak: USAK,
  adsUsakBooking: 'UsakBookLabel1',
  adsUsakPhone: 'UsakPhoneLabel1',
  adsUsakWhatsapp: 'UsakWaLabel0001',
});

test('yalnızca mevcut hesap: gtag config tek AW, Uşak etiketi yok', () => {
  const plan = googleTagPlan(cfg());
  assert.deepEqual(plan, {
    scriptId: 'G-JBTHYBQRSY',
    calls: [
      { id: 'G-JBTHYBQRSY', params: { send_page_view: false } },
      { id: PRIMARY },
    ],
  });
  assert.deepEqual(bookingConversionTargets(cfg(), 2), [`${PRIMARY}/NrO-CJy_k7QdEOvk2PVE`]);
  assert.deepEqual(contactConversionTargets(cfg(), 'phone', { href: 'tel:05531222279', path: '/' }), [
    `${PRIMARY}/PG5NCO6bi7QdEOvk2PVE`,
  ]);
});

test('iki hesap: her iki AW config edilir, aynı kimlik tekrarlanmaz', () => {
  const plan = googleTagPlan(both);
  assert.equal(plan?.scriptId, 'G-JBTHYBQRSY');
  assert.deepEqual(
    plan?.calls.map((c) => c.id),
    ['G-JBTHYBQRSY', PRIMARY, USAK],
  );
  const same = googleTagPlan(cfg({ adsUsak: PRIMARY, adsUsakBooking: 'UsakBookLabel1' }));
  assert.deepEqual(
    same?.calls.map((c) => c.id),
    ['G-JBTHYBQRSY', PRIMARY],
  );
});

test('Uşak rezervasyonu her iki etikete, Adana yalnızca mevcut hesaba gider', () => {
  assert.deepEqual(bookingConversionTargets(both, 2), [
    `${PRIMARY}/NrO-CJy_k7QdEOvk2PVE`,
    `${USAK}/UsakBookLabel1`,
  ]);
  assert.deepEqual(bookingConversionTargets(both, '2'), [
    `${PRIMARY}/NrO-CJy_k7QdEOvk2PVE`,
    `${USAK}/UsakBookLabel1`,
  ]);
  assert.deepEqual(bookingConversionTargets(both, 1), [`${PRIMARY}/NrO-CJy_k7QdEOvk2PVE`]);
  assert.deepEqual(bookingConversionTargets(cfg({ adsUsak: USAK }), 2), [`${PRIMARY}/NrO-CJy_k7QdEOvk2PVE`]);
});

test('ortak sayfada numara esas alınır', () => {
  const usakPhone = { href: 'tel:05531222279', path: '/' };
  const adanaPhone = { href: 'tel:+905058987666', path: '/' };
  const usakWa = {
    href: 'https://wa.me/905531222279?text=Merhaba%2C%20UYUROOM%20HOTEL%20U%C5%9Fak',
    path: '/contact',
  };
  const adanaWa = { href: 'https://api.whatsapp.com/send?phone=905058987666&text=Merhaba%20', path: '/tesisler' };
  assert.equal(isUsakContact(usakPhone), true);
  assert.equal(isUsakContact(adanaPhone), false);
  assert.equal(isUsakContact(usakWa), true);
  assert.equal(isUsakContact(adanaWa), false);
  assert.deepEqual(contactConversionTargets(both, 'phone', usakPhone), [
    `${PRIMARY}/PG5NCO6bi7QdEOvk2PVE`,
    `${USAK}/UsakPhoneLabel1`,
  ]);
  assert.deepEqual(contactConversionTargets(both, 'phone', adanaPhone), [`${PRIMARY}/PG5NCO6bi7QdEOvk2PVE`]);
  assert.deepEqual(contactConversionTargets(both, 'whatsapp', usakWa), [
    `${PRIMARY}/bvCbCNmbi7QdEOvk2PVE`,
    `${USAK}/UsakWaLabel0001`,
  ]);
  assert.deepEqual(contactConversionTargets(both, 'whatsapp', adanaWa), [`${PRIMARY}/bvCbCNmbi7QdEOvk2PVE`]);
  assert.equal(isUsakContact({ href: 'tel:02121234567', path: '/' }), false);
});

test('Uşak sayfasında Adana numarası Uşak hesabına yazılmaz; numarasız tıklama yazılır', () => {
  assert.equal(isUsakContact({ href: 'tel:05058987666', path: '/tesis/2' }), false);
  assert.equal(isUsakContact({ href: 'tel:02120000000', path: '/tesis/2' }), true);
  assert.equal(isUsakContact({ path: '/room/1' }), true);
  assert.equal(isUsakContact({ path: '/room/4' }), false);
  assert.equal(isUsakContact({ path: '/booking', search: '?hotel_id=2' }), true);
  assert.equal(isUsakContact({ path: '/booking?hotel_id=1' }), false);
  assert.equal(isUsakContact({ path: '/blog/usak-otel-konaklama' }), true);
  assert.equal(isUsakContact({ path: '/blog/is-seyahati-otel-adana-usak' }), false);
  assert.equal(isUsakContact({ href: 'tel:0553 122 22 79', path: '/blog/adana-otel-konaklama' }), true);
  assert.equal(isUsakContact({ href: 'tel:05058987666', hotelId: 2, path: '/tesis/2' }), false);
  assert.equal(isUsakContact({ hotelId: '2', path: '/' }), true);
});
