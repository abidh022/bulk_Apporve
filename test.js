fetch("https://crm.zoho.in/crm/v2/Approvals?type=awaiting&per_page=1000", {
  "headers": {
    "accept": "*/*",
    "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
    "priority": "u=1, i",
    "sec-ch-ua": "\"Not)A;Brand\";v=\"8\", \"Chromium\";v=\"138\", \"Google Chrome\";v=\"138\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "x-client-subversion": "3a0d3e15b9286610fce2ead2fab6bc2b",
    "x-crm-org": "60017871470",
    "x-murphy-session-id": "96ab2b80-3264-411d-9eff-94f918e42b0e",
    "x-murphy-span-id": "28ee346b-6be6-4a42-bc48-3b314ae1dec3",
    "x-murphy-tab-id": "0803d0a3-7c52-402f-ba14-09869ca3190a",
    "x-murphy-trace-id": "bf7cf014-d619-4b30-9b48-0fc293388d91",
    "x-my-normurl": "crm.tab.module.index-module",
    "x-requested-with": "XMLHttpRequest, XMLHttpRequest",
    "x-static-version": "11139775",
    "x-zcsrf-token": "crmcsrfparam=b80d68fb3a5eab99a3ff06b8190c42c1eebf2c79ebcfc1632487a5d600031bf62a8ae1f0d32960361e1905450359e37b292ddc2dbab4d6922cd95e6d250d94ae",
    "x-zoho-service": "widget",
    "x-zoho-service-details": "{\"widget_id\":\"419394000007739611\",\"widget_name\":\"test\"}",
    "cookie": "zalb_9ca8afda3c=fac0a3c7d4fe3fa3f2aad8c41a46c1dc; zalb_853bccbcf7=cf34288a64d07c36ca2dee75c9b2297c; _iamadt=cf3824a4708c1aa2d662adb5e51fdb426b1d89cc4108049a29d5d1b03b10c0c54e8c78d69d0a34c00689361f1508ac0e; _iambdt=52827530a073e9d458b4df55ceade7060659f35998bf7f63beefbc35f4fdff797e9ba3eeda1c6fb40d8f97c7d7c18819db8ba4fd6c87135c9800d585fe17e470; crmcsr=b80d68fb3a5eab99a3ff06b8190c42c1eebf2c79ebcfc1632487a5d600031bf62a8ae1f0d32960361e1905450359e37b292ddc2dbab4d6922cd95e6d250d94ae; _zcsr_tmp=b80d68fb3a5eab99a3ff06b8190c42c1eebf2c79ebcfc1632487a5d600031bf62a8ae1f0d32960361e1905450359e37b292ddc2dbab4d6922cd95e6d250d94ae; CSRF_TOKEN=b80d68fb3a5eab99a3ff06b8190c42c1eebf2c79ebcfc1632487a5d600031bf62a8ae1f0d32960361e1905450359e37b292ddc2dbab4d6922cd95e6d250d94ae; CT_CSRF_TOKEN=b80d68fb3a5eab99a3ff06b8190c42c1eebf2c79ebcfc1632487a5d600031bf62a8ae1f0d32960361e1905450359e37b292ddc2dbab4d6922cd95e6d250d94ae; wms-tkp-token=60034828951-0c8cf873-f15082bbcd85c48ee02afa65bfccbd8b; zalb_358732d832=8fb4e4515ad179bc63285ac8e71a4b76; zalb_e08e6c5e14=2885be5472b6bfc72d6c0154faaebe72; zalb_0cf07bf5a3=758f4df16db95824532406fa5a97eca0; drecn=b80d68fb3a5eab99a3ff06b8190c42c1eebf2c79ebcfc1632487a5d600031bf62a8ae1f0d32960361e1905450359e37b292ddc2dbab4d6922cd95e6d250d94ae; showEditorLeftPane=undefined; zalb_941ef25d4b=dad8f68e44ed432f46d59c0ffc7b2682; CROSSCDNCOUNTRY=IN; CROSSCDNID=17e95be7862ebf2dc3c8e5a32f603fed8d329b31693a1956deb621653eb5f1bbc5e9cc0a7b6a72bf0dc5548eaef15858; JSESSIONID=4625194FD687B55681E365529E4D62DA; zalb_814af6c8e8=026e2fea87199bc400d3fb7da2a4786f; com_chat_owner=1754027012056; com_avcliq_owner=1754027012058",
    "Referer": "https://crm.zoho.in/"
  },
  "body": null,
  "method": "GET"
}).then(val => val).then(val => console.log(val)).catch(res => console.error(res));