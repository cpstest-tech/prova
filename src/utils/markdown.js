/**
 * Converte testo Markdown in HTML (versione semplificata)
 * @param {string} markdown - Testo in formato Markdown
 * @returns {string} HTML renderizzato
 */
export function parseMarkdown(markdown) {
  if (!markdown) return '';
  
  try {
    return markdown
      // H1: #Titolo o # Titolo -> <h1>Titolo</h1>
      .replace(/^#\s*(.+)$/gm, '<h1>$1</h1>')
      // H2: ##Titolo o ## Titolo -> <h2>Titolo</h2>
      .replace(/^##\s*(.+)$/gm, '<h2>$1</h2>')
      // H3: ###Titolo o ### Titolo -> <h3>Titolo</h3>
      .replace(/^###\s*(.+)$/gm, '<h3>$1</h3>')
      // H4: ####Titolo o #### Titolo -> <h4>Titolo</h4>
      .replace(/^####\s*(.+)$/gm, '<h4>$1</h4>')
      // H5: #####Titolo o ##### Titolo -> <h5>Titolo</h5>
      .replace(/^#####\s*(.+)$/gm, '<h5>$1</h5>')
      // H6: ######Titolo o ###### Titolo -> <h6>Titolo</h6>
      .replace(/^######\s*(.+)$/gm, '<h6>$1</h6>')
      // Bold: **testo** -> <strong>testo</strong>
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Italic: *testo* -> <em>testo</em>
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Links: [testo](url) -> <a href="url">testo</a>
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      // Line breaks: \n\n -> </p><p>
      .replace(/\n\n/g, '</p><p>')
      // Single line breaks: \n -> <br>
      .replace(/\n/g, '<br>')
      // Wrap in paragraphs (but not if it's already a heading)
      .replace(/^(?!<h[1-6]>)(.*)$/gm, '<p>$1</p>')
      // Clean up empty paragraphs
      .replace(/<p><\/p>/g, '')
      // Clean up paragraphs that only contain breaks
      .replace(/<p><br><\/p>/g, '');
  } catch (error) {
    console.error('Errore nel parsing Markdown:', error);
    // Fallback: converti solo i newline in <br>
    return markdown.replace(/\n/g, '<br />');
  }
}

/**
 * Converte solo i titoli Markdown in HTML (versione leggera)
 * @param {string} text - Testo con titoli Markdown
 * @returns {string} HTML con titoli convertiti
 */
export function parseMarkdownTitles(text) {
  if (!text) return '';
  
  return text
    // H1: # Titolo -> <h1>Titolo</h1>
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // H2: ## Titolo -> <h2>Titolo</h2>
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    // H3: ### Titolo -> <h3>Titolo</h3>
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    // H4: #### Titolo -> <h4>Titolo</h4>
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    // H5: ##### Titolo -> <h5>Titolo</h5>
    .replace(/^##### (.+)$/gm, '<h5>$1</h5>')
    // H6: ###### Titolo -> <h6>Titolo</h6>
    .replace(/^###### (.+)$/gm, '<h6>$1</h6>')
    // Converti newline in <br>
    .replace(/\n/g, '<br />');
}
