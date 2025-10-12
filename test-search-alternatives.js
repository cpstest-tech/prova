#!/usr/bin/env node

/**
 * Test specifico per debuggare la ricerca di prodotti alternativi
 */

import { PriceChecker } from './server/utils/priceChecker.js';

async function testSearchAlternatives() {
  console.log('🔍 Test ricerca prodotti alternativi...');
  
  const priceChecker = new PriceChecker();
  
  try {
    await priceChecker.init();
    
    // Test con diversi termini di ricerca
    const testSearches = [
      {
        term: 'AMD Ryzen 5 5600',
        minPrice: 100,
        maxPrice: 200
      },
      {
        term: 'CPU AMD',
        minPrice: 50,
        maxPrice: 300
      },
      {
        term: 'processore',
        minPrice: 50,
        maxPrice: 200
      }
    ];
    
    for (const search of testSearches) {
      console.log(`\n🔍 Test ricerca: "${search.term}" (€${search.minPrice}-${search.maxPrice})`);
      
      const results = await priceChecker.searchAlternativeProducts(
        search.term, 
        search.maxPrice, 
        search.minPrice
      );
      
      console.log(`✅ Trovati ${results.length} prodotti`);
      
      if (results.length > 0) {
        results.slice(0, 3).forEach((product, index) => {
          console.log(`   ${index + 1}. ${product.title?.substring(0, 60)}...`);
          console.log(`      Prezzo: €${product.price}`);
          console.log(`      Link: ${product.link}`);
          console.log(`      Disponibile: ${product.available}`);
        });
      } else {
        console.log('   ⚠️ Nessun prodotto trovato');
        
        // Test manuale della pagina di ricerca
        console.log('   🔍 Debug: Verifico la pagina di ricerca...');
        const searchUrl = `https://www.amazon.it/s?k=${encodeURIComponent(search.term)}&rh=p_36:${Math.floor(search.minPrice * 100)}-${Math.floor(search.maxPrice * 100)}`;
        console.log(`   URL: ${searchUrl}`);
        
        await priceChecker.page.goto(searchUrl, { 
          waitUntil: 'networkidle2',
          timeout: 30000 
        });
        
        await priceChecker.page.waitForTimeout(3000);
        
        // Controlla elementi presenti nella pagina
        const pageInfo = await priceChecker.page.evaluate(() => {
          const productElements = document.querySelectorAll('[data-component-type="s-search-result"]');
          const alternativeSelectors = [
            '.s-result-item',
            '[data-asin]',
            '.s-search-result',
            '.s-result-item[data-asin]'
          ];
          
          const results = {
            searchResults: productElements.length,
            alternativeSelectors: {}
          };
          
          alternativeSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            results.alternativeSelectors[selector] = elements.length;
          });
          
          // Controlla se ci sono messaggi di errore
          const errorMessages = document.querySelectorAll('.a-alert-information, .s-no-results, .a-text-bold');
          results.errorMessages = Array.from(errorMessages).map(el => el.textContent.trim()).filter(text => text.length > 0);
          
          return results;
        });
        
        console.log('   📊 Debug risultati:');
        console.log(`      Search results: ${pageInfo.searchResults}`);
        Object.entries(pageInfo.alternativeSelectors).forEach(([selector, count]) => {
          console.log(`      ${selector}: ${count} elementi`);
        });
        
        if (pageInfo.errorMessages.length > 0) {
          console.log('   ⚠️ Messaggi di errore:');
          pageInfo.errorMessages.forEach(msg => console.log(`      - ${msg}`));
        }
      }
      
      // Pausa tra le ricerche
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
  } catch (error) {
    console.error('❌ Errore:', error.message);
  } finally {
    await priceChecker.close();
  }
}

testSearchAlternatives();
