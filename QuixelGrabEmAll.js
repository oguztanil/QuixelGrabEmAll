// Yaklaşık 10k item elde ettikten sonra 403 hatası verecek. Birkaç dakika bekleyip sayfayı yeniledikten sonra kodu ikinci kez çalıştırmadan önce "startPage = 9" yazmayı unutma 
(async (startPage = 0, autoClearConsole = true) => {
  // Token'ı kullanıcıdan elle iste
  const authToken = prompt("Lütfen Quixel API token'ınızı girin:");

  if (!authToken) {
    console.error("Geçerli bir token sağlanmadı. İşlem iptal edildi.");
    return;
  }

  // API'yi çağırmak için kullanılan fonksiyon
  const callCacheApi = async (params = {}) => {
    const defaultParams = {
      page: 0,
      maxValuesPerFacet: 1000,
      hitsPerPage: 1000,
      attributesToRetrieve: ["id", "name"].join(",")
    };

    try {
      const response = await fetch("https://proxy-algolia-prod.quixel.com/algolia/cache", {
        headers: {
          "x-api-key": "2Zg8!d2WAHIUW?pCO28cVjfOt9seOWPx@2j"
        },
        body: JSON.stringify({
          url: "https://6UJ1I5A072-2.algolianet.com/1/indexes/assets/query?x-algolia-application-id=6UJ1I5A072&x-algolia-api-key=e93907f4f65fb1d9f813957bdc344892",
          params: new URLSearchParams({ ...defaultParams, ...params }).toString()
        }),
        method: "POST"
      });

      return await response.json();
    } catch (error) {
      console.error("API isteği başarısız oldu:", error);
      return null;
    }
  };

  // Varlığı Quixel hesabına eklemek için fonksiyon
  const callAcl = async ({ id, name }) => {
    console.log(`  --> Adding Item ${id} | ${name}...`);

    try {
      const response = await fetch("https://quixel.com/v1/acl", {
        headers: {
          "authorization": "Bearer " + authToken,
          "content-type": "application/json;charset=UTF-8",
        },
        body: JSON.stringify({ assetID: id }),
        method: "POST",
      });

      const json = await response.json();
      if (json?.isError) {
        console.error(`  --> **UNABLE TO ADD ITEM** Item ${id} | ${name} (${json?.msg})`);
      } else {
        console.log(`  --> ADDED ITEM Item ${id} | ${name}`);
      }
    } catch (error) {
      console.error(`API isteği sırasında bir hata oluştu: ${error}`);
    }
  };

  // Kullanıcıya işlemin başlatıldığını bildir
  console.log("-> Getting Total Number of Pages...");
  const { nbPages: totalPages, hitsPerPage: itemsPerPage, nbHits: totalItems } = await callCacheApi();

  console.log(`-> Total Items to add: ${totalItems} | ${totalPages} total pages with ${itemsPerPage} per page`);
  if (!confirm(`Click OK to start adding ${totalItems} items in your account.`)) return;

  // Sayfalar arasında döngü oluştur
  for (let pageIdx = startPage || 0; pageIdx < totalPages; pageIdx++) {
    console.log("-> ======================= PAGE " + pageIdx + " START =======================");

    const { hits: items } = await callCacheApi({ page: pageIdx });
    const aclPromises = items.map(callAcl);

    await Promise.all(aclPromises);
    console.log("-> ======================= PAGE " + pageIdx + " COMPLETED =======================");

    if (autoClearConsole) console.clear(); // Konsolu temizle
  }
})();
