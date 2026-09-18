import http from 'k6/http';
import { check, sleep } from 'k6';
import { expect } from 'https://jslib.k6.io/k6-testing/0.6.1/index.js';

const path = '/pet';

const params = {
    headers: {
        'Content-Type': 'application/json'
    },
};

const payload = JSON.stringify({
    id: 1,
    name: 'K6',
    category: {
        id: 1,
        name: 'K6',
    },
    photoUrls: ['https://www.k6.io/img/logo.png'],
    tags: [{ id: 1, name: 'K6' }],
    status: 'available'
});

export function postPetTest(baseUrl) {
    const response = http.post(baseUrl + path, payload, params);

    expect(response.status).toBe(200);
    expect.soft(response.status).toBe(200);

    check(response, {
        'status is 200': (r) => r.status === 200,
    });
    sleep(1);
}