(async () => {
    const testUrl = 'https://www.tiktok.com/@scout2015/video/6718335390845095173';
    const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(testUrl)}`);
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
})();
