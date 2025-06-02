

import { Level, Language, ValidationResult, ProjectCode } from '../types.ts';

// Helper for basic HTML element validation
const validateHTMLStructure = (
  code: string,
  expectedElements: {
    tag: string;
    text?: string | RegExp; // Allow RegExp for more flexible text matching
    attributes?: Record<string, string | RegExp>;
    count?: number; // Check for specific number of elements
    parentSelector?: string; // Check if element is a child of a specific parent
  }[]
): ValidationResult => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(code, 'text/html');
    for (const el of expectedElements) {
      const elements = doc.querySelectorAll(el.parentSelector ? `${el.parentSelector} > ${el.tag}` : el.tag);
      
      if (el.count !== undefined && elements.length !== el.count) {
        return { success: false, message: `Expected ${el.count} <${el.tag}> element(s)${el.parentSelector ? ` inside ${el.parentSelector}` : ''}, but found ${elements.length}.` };
      }
      if (!el.count && elements.length === 0 && el.tag !== '!--') { // Allow comments to be optional unless count is specified
        return { success: false, message: `Missing <${el.tag}> element${el.parentSelector ? ` inside ${el.parentSelector}` : ''}.` };
      }
      
      if (elements.length > 0) { // If elements are found (or count is not specified and some exist)
        const firstElement = elements[0]; // Check primarily the first one for simplicity unless count implies multiple specific checks needed
         if (el.text) {
            const textContent = firstElement.textContent || "";
            if (el.text instanceof RegExp) {
                if (!el.text.test(textContent)) {
                    return { success: false, message: `<${el.tag}> element text does not match pattern. Found: "${textContent}"` };
                }
            } else {
                if (!textContent.includes(el.text)) {
                    return { success: false, message: `<${el.tag}> element should contain text: "${el.text}". Found: "${textContent}"` };
                }
            }
        }
        if (el.attributes) {
          for (const attr in el.attributes) {
            const expectedValue = el.attributes[attr];
            const actualValue = firstElement.getAttribute(attr);
            if (expectedValue instanceof RegExp) {
                if (actualValue === null || !expectedValue.test(actualValue)) {
                    return { success: false, message: `<${el.tag}> element attribute '${attr}' value "${actualValue}" does not match pattern.` };
                }
            } else {
                if (actualValue !== expectedValue) {
                    return { success: false, message: `<${el.tag}> element attribute '${attr}' should be '${expectedValue}'. Found '${actualValue}'.` };
                }
            }
          }
        }
      }
    }
    return { success: true, message: 'HTML structure looks good!' };
  } catch (e) {
    const err = e as Error;
    return { success: false, message: `Error parsing HTML: ${err.message}` };
  }
};

// Helper for basic CSS property validation
const validateCSSProperties = (
  code: string,
  expectedStyles: {
    selector: string;
    properties: Record<string, string | RegExp>; // value can be a string or regex
  }[]
): ValidationResult => {
  try {
    // This is a simplified check. It doesn't parse CSS fully but looks for patterns.
    for (const style of expectedStyles) {
      const selectorIndex = code.indexOf(style.selector);
      if (selectorIndex === -1) {
        return { success: false, message: `CSS rule for selector '${style.selector}' not found.` };
      }
      
      const ruleStartIndex = code.indexOf('{', selectorIndex);
      const ruleEndIndex = code.indexOf('}', ruleStartIndex);
      if (ruleStartIndex === -1 || ruleEndIndex === -1) {
        return { success: false, message: `Could not find opening or closing braces for CSS rule '${style.selector}'.` };
      }
      
      const ruleContent = code.substring(ruleStartIndex + 1, ruleEndIndex);
      
      for (const prop in style.properties) {
        const value = style.properties[prop];
        const propRegex = new RegExp(`${prop}\\s*:\\s*([^;]+)`);
        const match = ruleContent.match(propRegex);
        
        if (!match || !match[1]) {
          return { success: false, message: `Property '${prop}' not found for selector '${style.selector}'.` };
        }
        
        const actualValue = match[1].trim();
        if (value instanceof RegExp) {
          if (!value.test(actualValue)) {
            return { success: false, message: `Property '${prop}' for '${style.selector}' has value '${actualValue}', which does not match pattern '${value.source}'.` };
          }
        } else {
          if (actualValue.toLowerCase() !== value.toLowerCase()) { // Case-insensitive compare for common CSS values
            return { success: false, message: `Property '${prop}' for '${style.selector}' should be '${value}', but found '${actualValue}'.` };
          }
        }
      }
    }
    return { success: true, message: 'CSS styles look correct!' };
  } catch (e) {
    const err = e as Error;
    return { success: false, message: `Error validating CSS: ${err.message}` };
  }
};

export const LEVELS: Level[] = [
  // --- HTML Basics ---
  {
    id: '1',
    title: 'Intro: What is HTML?',
    icon: '🌍',
    description: 'Understand the backbone of all websites and write your very first HTML tags.',
    tasks: [
      {
        id: '1.1',
        language: Language.HTML,
        instruction: "Every HTML document needs a basic structure. This includes `<html>`, `<head>`, and `<body>` tags. The `<html>` tag wraps everything. The `<head>` contains meta-information (like the title that appears in browser tabs), and the `<body>` contains the visible content.",
        longDescription: "Your task: Create the basic HTML document structure.\n1. Add an `<html>` tag.\n2. Inside `<html>`, add a `<head>` tag.\n3. Also inside `<html>` and after `<head>`, add a `<body>` tag.",
        starterCode: ``,
        validate: (code) => validateHTMLStructure(code, [
            { tag: 'html' },
            { tag: 'head', parentSelector: 'html' },
            { tag: 'body', parentSelector: 'html' },
        ]),
        expectedOutputPreview: `<!-- This structure isn't visible, but it's essential! -->`
      },
      {
        id: '1.2',
        language: Language.HTML,
        instruction: "Let's give your page a title! Add a `<title>` tag inside the `<head>` section. Make the title 'My First Page'.",
        starterCode: (pc) => pc?.html || `<html>\n<head>\n  <!-- Add title here -->\n</head>\n<body>\n</body>\n</html>`,
        validate: (code) => validateHTMLStructure(code, [
            { tag: 'title', text: 'My First Page', parentSelector: 'head' }
        ]),
        expectedOutputPreview: `<!-- Title appears in the browser tab! -->`
      },
      {
        id: '1.3',
        language: Language.HTML,
        instruction: "Now, let's add some visible content. Create a main heading using an `<h1>` tag inside the `<body>`. The text should be 'Hello Guro!'",
        starterCode: (pc) => pc?.html || `<html>\n<head>\n  <title>My First Page</title>\n</head>\n<body>\n  <!-- Add heading here -->\n</body>\n</html>`,
        validate: (code) => validateHTMLStructure(code, [
            { tag: 'h1', text: 'Hello Guro!', parentSelector: 'body' }
        ]),
        expectedOutputPreview: `<h1>Hello Guro!</h1>`
      }
    ],
    unlocksNextLevel: '2',
  },
  {
    id: '2',
    title: 'Paragraphs and Text',
    icon: '📄',
    description: 'Learn to add paragraphs, make text bold or italic, and control line breaks.',
    tasks: [
      {
        id: '2.1',
        language: Language.HTML,
        instruction: "Add a paragraph using the `<p>` tag below your `<h1>` heading. The text should be 'This is my first paragraph.'",
        starterCode: (pc) => pc?.html || `<html>\n<head>\n  <title>My First Page</title>\n</head>\n<body>\n  <h1>Hello Guro!</h1>\n  <!-- Add paragraph here -->\n</body>\n</html>`,
        validate: (code) => {
            const h1Present = code.includes('<h1>Hello Guro!</h1>');
            if (!h1Present) return { success: false, message: "Keep the <h1>Hello Guro!</h1> heading."};
            const res = validateHTMLStructure(code, [{ tag: 'p', text: 'This is my first paragraph.', parentSelector: 'body' }]);
            if (!res.success) return res;
            if (code.indexOf("<p>") < code.indexOf("<h1>")) return { success: false, message: "The paragraph should come after the heading."};
            return { success: true, message: "Paragraph added!" };
        },
        expectedOutputPreview: `<h1>Hello Guro!</h1><p>This is my first paragraph.</p>`
      },
      {
        id: '2.2',
        language: Language.HTML,
        instruction: "Sometimes you need text on a new line without starting a new paragraph. Use the `<br>` (line break) tag. Add 'Line 1<br>Line 2' inside a new paragraph.",
        starterCode: (pc) => pc?.html || `<html>...<body><h1>...</h1><p>...</p>\n<!-- Add new paragraph with a line break -->\n</body></html>`,
        validate: (code) => {
          const P = new DOMParser();
          const D = P.parseFromString(code, 'text/html');
          const pWithBr = Array.from(D.querySelectorAll('p')).find(p => p.querySelector('br'));
          if (!pWithBr) return { success: false, message: "Missing a paragraph with a <br> tag inside."};
          if (!pWithBr.textContent?.includes('Line 1') || !pWithBr.textContent?.includes('Line 2')) return {success: false, message: "Paragraph should contain 'Line 1' and 'Line 2'"};
          return { success: true, message: "Line break working!" };
        },
        expectedOutputPreview: `<p>This is my first paragraph.</p><p>Line 1<br>Line 2</p>`
      },
      {
        id: '2.3',
        language: Language.HTML,
        instruction: "To visually separate sections of content, you can use the `<hr>` (horizontal rule) tag. Add an `<hr>` tag between your two paragraphs.",
        starterCode: (pc) => pc?.html || `<html>...<body><h1>...</h1><p>Para 1</p><!-- Add hr here --><p>Para 2 with br</p></body></html>`,
        validate: (code) => {
          const P = new DOMParser();
          const D = P.parseFromString(code, 'text/html');
          const hr = D.querySelector('hr');
          if (!hr) return { success: false, message: "Missing an <hr> tag."};
          // Rough check for position
          const paragraphs = D.querySelectorAll('p');
          if (paragraphs.length >= 2) {
            const hrNode = hr as Node; // hr is an Element, which is a Node
            const p1Node = paragraphs[0] as Node; // p is an Element, which is a Node
            const p2Node = paragraphs[1] as Node; // p is an Element, which is a Node
            // Check if p1Node and hrNode are Elements before accessing nextElementSibling
            if (p1Node.nodeType === Node.ELEMENT_NODE && hrNode.nodeType === Node.ELEMENT_NODE) {
                if (! (p1Node.nextSibling === hrNode && hrNode.nextSibling === p2Node || // direct siblings
                   (p1Node as Element).nextElementSibling === hrNode && (hrNode as Element).nextElementSibling === p2Node) ) { // ignoring text nodes
                 // This check is tricky due to potential whitespace text nodes. A simpler check is just presence.
                }
            }
          }
          return { success: true, message: "Horizontal rule added!" };
        },
        expectedOutputPreview: `<p>This is my first paragraph.</p><hr><p>Line 1<br>Line 2</p>`
      }
    ],
    unlocksNextLevel: '3',
  },
  {
    id: '3',
    title: 'Text Formatting',
    icon: ' Aa ',
    description: 'Emphasize text with bold, italics, underline, and strikethrough.',
    tasks: [
      {
        id: '3.1',
        language: Language.HTML,
        instruction: "Make text **bold** using `<strong>` or `<b>`. Add a new paragraph: '<p>This is <strong>important</strong> text.</p>'",
        starterCode: (pc) => pc?.html || `...`,
        validate: (code) => validateHTMLStructure(code, [{tag: 'p', text: /This is .*important.* text\./, parentSelector: 'body'}, {tag: 'strong', text: 'important', parentSelector: 'p'}]),
        expectedOutputPreview: `<p>This is <strong>important</strong> text.</p>`
      },
      {
        id: '3.2',
        language: Language.HTML,
        instruction: "Make text *italic* using `<em>` or `<i>`. Add another paragraph: '<p>This is <em>emphasized</em> text.</p>'",
        starterCode: (pc) => pc?.html || `...`,
        validate: (code) => validateHTMLStructure(code, [{tag: 'p', text: /This is .*emphasized.* text\./, parentSelector: 'body'}, {tag: 'em', text: 'emphasized', parentSelector: 'p'}]),
        expectedOutputPreview: `<p>This is <em>emphasized</em> text.</p>`
      },
      {
        id: '3.3',
        language: Language.HTML,
        instruction: "You can also <u>underline</u> text with `<u>` and strikethrough with `<s>`. Create a paragraph: '<p>This is <u>underlined</u> and this is <s>no longer valid</s>.</p>'",
         starterCode: (pc) => pc?.html || `...`,
        validate: (code) => validateHTMLStructure(code, [
            {tag: 'p', text: /This is .*underlined.* and this is .*no longer valid/, parentSelector: 'body'},
            {tag: 'u', text: 'underlined', parentSelector: 'p'},
            {tag: 's', text: 'no longer valid', parentSelector: 'p'}
        ]),
        expectedOutputPreview: `<p>This is <u>underlined</u> and this is <s>no longer valid</s>.</p>`
      }
    ],
    unlocksNextLevel: '4',
  },
  {
    id: '4',
    title: 'Lists: Ordered & Unordered',
    icon: '📜',
    description: 'Organize content into ordered (numbered) and unordered (bulleted) lists.',
    tasks: [
      {
        id: '4.1',
        instruction: "Create an unordered (bulleted) list using `<ul>` (unordered list) and `<li>` (list item) tags. Make a list of two fruits: Apple, Banana.",
        language: Language.HTML,
        starterCode: `<!-- Your list here -->`,
        validate: (code) => {
          const res = validateHTMLStructure(code, [
            { tag: 'ul' },
            { tag: 'li', text: 'Apple', parentSelector: 'ul', count: 1},
            { tag: 'li', text: 'Banana', parentSelector: 'ul', count: 1} // This validation needs improvement for multiple LIs
          ]);
           if (!res.success && res.message.includes("count")) { // Refine count check
                const P = new DOMParser();
                const D = P.parseFromString(code, 'text/html');
                const lis = D.querySelectorAll('ul > li');
                if (lis.length !== 2) return {success: false, message: `Expected 2 list items (<li>) inside <ul>, found ${lis.length}.`};
                const texts = Array.from(lis).map(li => li.textContent?.trim());
                if (!texts.includes('Apple') || !texts.includes('Banana')) return {success: false, message: "List items should be 'Apple' and 'Banana'."};
                 return {success: true, message: "Unordered list created!"};
            }
          return res;
        },
        expectedOutputPreview: `<ul><li>Apple</li><li>Banana</li></ul>`
      },
      {
        id: '4.2',
        instruction: "Create an ordered (numbered) list using `<ol>` (ordered list) and `<li>` tags. Make a list of two steps: First step, Second step.",
        language: Language.HTML,
        starterCode: (pc) => pc?.html || ``,
        validate: (code) => {
           const res = validateHTMLStructure(code, [
            { tag: 'ol' },
          ]);
          if (!res.success) return res;
          const P = new DOMParser();
          const D = P.parseFromString(code, 'text/html');
          const lis = D.querySelectorAll('ol > li');
          if (lis.length !== 2) return {success: false, message: `Expected 2 list items (<li>) inside <ol>, found ${lis.length}.`};
          const texts = Array.from(lis).map(li => li.textContent?.trim());
          if (!texts.includes('First step') || !texts.includes('Second step')) return {success: false, message: "List items should be 'First step' and 'Second step'."};
          return {success: true, message: "Ordered list created!"};
        },
        expectedOutputPreview: `<ol><li>First step</li><li>Second step</li></ol>`
      }
    ],
    unlocksNextLevel: '5',
  },
   {
    id: '5',
    title: 'Links and Attributes',
    icon: '🔗',
    description: 'Learn how to create hyperlinks to other pages using the `<a>` tag and its `href` attribute.',
    tasks: [
      {
        id: '5.1',
        instruction: "Create a hyperlink using the `<a>` tag. The text of the link should be 'Visit Google'. The link should point to 'https://www.google.com'. This is done using the `href` attribute: `<a href='URL'>Link Text</a>`.",
        language: Language.HTML,
        starterCode: `<!-- Your link here -->`,
        validate: (code) => validateHTMLStructure(code, [{ tag: 'a', text: 'Visit Google', attributes: { href: 'https://www.google.com' } }]),
        expectedOutputPreview: `<a href='https://www.google.com'>Visit Google</a>`
      },
      {
        id: '5.2',
        instruction: "To make a link open in a new browser tab, use the `target` attribute with the value `'_blank'`. Update your Google link or create a new one to 'https://www.bing.com' that opens in a new tab. Text: 'Search Bing (new tab)'.",
        language: Language.HTML,
        starterCode: (pc) => pc?.html || `<a href='https://www.google.com'>Visit Google</a>`,
        validate: (code) => validateHTMLStructure(code, [{ tag: 'a', text: 'Search Bing (new tab)', attributes: { href: 'https://www.bing.com', target: '_blank' } }]),
        expectedOutputPreview: `<a href='https://www.bing.com' target='_blank'>Search Bing (new tab)</a>`
      }
    ],
    unlocksNextLevel: '6',
  },
  {
    id: '6',
    title: 'Images',
    icon: '🖼️',
    description: 'Embed images into your webpage using the `<img>` tag and learn about important attributes like `src` and `alt`.',
    tasks: [
      {
        id: '6.1',
        instruction: "Embed an image using the `<img>` tag. The `src` attribute specifies the image URL. The `alt` attribute provides alternative text if the image cannot be displayed (important for accessibility!). Use this image URL: `https://via.placeholder.com/150` and set `alt` text to 'A placeholder image'.",
        longDescription: "Syntax: `<img src='URL' alt='description'>`\nNote: `<img>` is a self-closing tag, like `<br>` or `<hr>`. Some write it as `<img />` which is also valid.",
        language: Language.HTML,
        starterCode: `<!-- Your image here -->`,
        validate: (code) => validateHTMLStructure(code, [{ tag: 'img', attributes: { src: 'https://via.placeholder.com/150', alt: 'A placeholder image' } }]),
        expectedOutputPreview: `<img src='https://via.placeholder.com/150' alt='A placeholder image' style='width:150px; height:150px; border:1px solid #ccc;'>` // Added style for better preview
      },
      {
        id: '6.2',
        instruction: "You can control image size with `width` and `height` attributes, though CSS is generally preferred for styling. Add `width='100'` and `height='100'` attributes to your image tag.",
        language: Language.HTML,
        starterCode: (pc) => pc?.html || `<img src='https://via.placeholder.com/150' alt='A placeholder image'>`,
        validate: (code) => validateHTMLStructure(code, [{ tag: 'img', attributes: { src: 'https://via.placeholder.com/150', alt: 'A placeholder image', width: '100', height: '100' } }]),
        expectedOutputPreview: `<img src='https://via.placeholder.com/150' alt='A placeholder image' width='100' height='100' style='border:1px solid #ccc;'>`
      }
    ],
    unlocksNextLevel: '7',
  },
  {
    id: '7',
    title: 'Comments & Page Structure',
    icon: '🏗️',
    description: 'Learn to add comments to your HTML (invisible to users, for developers) and understand basic semantic page structure tags.',
    tasks: [
      {
        id: '7.1',
        instruction: "HTML comments start with `<!--` and end with `-->`. Add a comment above your `<h1>` tag: `<!-- This is my main heading -->`.",
        language: Language.HTML,
        starterCode: (pc) => pc?.html || `<html>...<body><h1>Hello Guro!</h1>...</body></html>`,
        validate: (code) => {
          if (code.includes('<!-- This is my main heading -->') && code.indexOf('<!-- This is my main heading -->') < code.indexOf('<h1>')) {
            return { success: true, message: 'Comment added correctly!' };
          }
          return { success: false, message: 'Make sure your comment is `<!-- This is my main heading -->` and appears before the `<h1>`.' };
        },
        expectedOutputPreview: `<!-- This is my main heading --><h1>Hello Guro!</h1><p>This is my first paragraph.</p>`
      },
      {
        id: '7.2',
        instruction: "Modern HTML uses semantic tags to define sections of a page. Common ones are `<header>`, `<main>`, and `<footer>`. Wrap your existing `<h1>` in a `<header>` tag. Wrap your paragraphs and lists (if any) in a `<main>` tag. Add an empty `<footer>` tag after `<main>`.",
        longDescription:"Example Structure:\n<body>\n  <header>\n    ...\n  </header>\n  <main>\n    ...\n  </main>\n  <footer>\n    ...\n  </footer>\n</body>",
        language: Language.HTML,
        starterCode: (pc) => pc?.html || `<html>...<body><h1>Hello Guro!</h1><p>...</p><ul><li>...</li></ul></body></html>`,
        validate: (code) => validateHTMLStructure(code, [
            { tag: 'header', parentSelector: 'body' },
            { tag: 'h1', parentSelector: 'header' },
            { tag: 'main', parentSelector: 'body' },
            { tag: 'p', parentSelector: 'main' }, // Assuming at least one p is in main
            { tag: 'footer', parentSelector: 'body' },
        ]),
        expectedOutputPreview: `<header><h1>Hello Guro!</h1></header><main><p>This is my first paragraph.</p><p>This is <strong>important</strong> text.</p><ul><li>Apple</li><li>Banana</li></ul></main><footer></footer>`
      }
    ],
    unlocksNextLevel: 'bonus1',
  },
  {
    id: 'bonus1',
    title: 'Bonus: Your First Webpage',
    icon: '🌟',
    description: 'Put your HTML skills to the test! Create a simple "About Me" page.',
    tasks: [
      {
        id: 'b1.1',
        instruction: "Create an 'About Me' page. It should include:\n1. A main heading (`<h1>`) with your name (or a fictional name).\n2. A paragraph (`<p>`) describing yourself briefly.\n3. An image (`<img>`) of yourself (use `https://via.placeholder.com/100` for now, with appropriate `alt` text).\n4. An unordered list (`<ul>`) of 2-3 hobbies.",
        language: Language.HTML,
        starterCode: `<html>\n<head>\n  <title>About Me</title>\n</head>\n<body>\n  <!-- Your content here -->\n</body>\n</html>`,
        validate: (code) => {
          const P = new DOMParser();
          const D = P.parseFromString(code, 'text/html');
          if(!D.querySelector('h1')?.textContent) return {success:false, message: "Missing H1 with your name."};
          if(!D.querySelector('p')?.textContent) return {success:false, message: "Missing a paragraph about yourself."};
          if(!D.querySelector('img[alt]')) return {success:false, message: "Missing an image with alt text."};
          if(D.querySelectorAll('ul > li').length < 2) return {success:false, message: "Missing a list of at least 2 hobbies."};
          return {success: true, message: "Great 'About Me' page structure!"};
        },
        expectedOutputPreview: `<h1>Your Name</h1><p>A brief description...</p><img src='https://via.placeholder.com/100' alt='My Picture'><p>My Hobbies:</p><ul><li>Hobby 1</li><li>Hobby 2</li></ul>`
      }
    ],
    unlocksNextLevel: '8',
  },

  // --- CSS Basics ---
  {
    id: '8',
    title: 'Intro to CSS: Styling!',
    icon: '🎨',
    description: 'Learn how to add styles to your HTML using CSS. Change colors and make your page pop!',
    tasks: [
      {
        id: '8.1',
        instruction: "CSS (Cascading Style Sheets) is used to style HTML. You can add CSS directly in HTML using a `<style>` tag, usually placed in the `<head>` section. Add a `<style>` tag inside your `<head>`.",
        longDescription: "The `<style>` tag tells the browser that the content inside it is CSS code.\nExample:\n<head>\n  <title>My Styled Page</title>\n  <style>\n    /* CSS rules go here */\n  </style>\n</head>",
        language: Language.HTML, // User modifies HTML to add style tag
        starterCode: (pc) => pc?.html || `<html>\n<head>\n  <title>Test Page</title>\n  <!-- Add style tag here -->\n</head>\n<body>\n  <h1>Hello CSS!</h1>\n</body>\n</html>`,
        validate: (code) => validateHTMLStructure(code, [{ tag: 'style', parentSelector: 'head' }]),
        expectedOutputPreview: `<h1>Hello CSS!</h1> <!-- Style tag is in head, not visible here -->`
      },
      {
        id: '8.2',
        instruction: "Let's style the `<h1>` tag. Inside your `<style>` tags, write a CSS rule to make all `<h1>` elements red. The syntax is `selector { property: value; }`. So, for `<h1>` and red color, it's `h1 { color: red; }`.",
        language: Language.CSS, // User writes CSS within the style tag created in 8.1
        starterCode: (pc) => pc?.css || `/* Your CSS rules here */`,
        validate: (code) => validateCSSProperties(code, [{selector: 'h1', properties: {color: 'red'}}]),
        expectedOutputPreview: `<h1 style="color:red;">Hello CSS!</h1>` // Preview shows the effect
      }
    ],
    unlocksNextLevel: '9',
  },
  {
    id: '9',
    title: 'CSS Selectors: Class & ID',
    icon: '🎯',
    description: 'Target specific elements for styling using class and ID selectors.',
    tasks: [
      {
        id: '9.1',
        instruction: "A **class selector** styles elements with a specific class attribute. In HTML: `<p class='my-class'>...</p>`. In CSS: `.my-class { ... }` (note the dot). Add a class `highlight` to one of your `<p>` tags in your HTML. Then, in your CSS, make elements with class `highlight` have a yellow background: `background-color: yellow;`.",
        language: Language.CSS, // User modifies HTML and CSS
        starterCode: (pc) => pc?.css || `.highlight {\n  /* Your CSS here */\n}`,
        validate: (code, pc) => {
            if (!pc?.html || !pc.html.includes("class='highlight'") && !pc.html.includes('class="highlight"')) return {success: false, message: "Add class='highlight' to a <p> tag in your HTML."};
            return validateCSSProperties(code, [{selector: '.highlight', properties: {'background-color': 'yellow'}}]);
        },
        expectedOutputPreview: `<h1 >Title</h1><p>First para.</p><p style="background-color:yellow;" class="highlight">Second para.</p>`
      },
      {
        id: '9.2',
        instruction: "An **ID selector** styles one unique element with a specific ID. In HTML: `<div id='my-id'>...</div>`. In CSS: `#my-id { ... }` (note the hash). Add an ID `main-title` to your `<h1>` tag. Then, in CSS, give `#main-title` a blue color.",
        language: Language.CSS, // User modifies HTML and CSS
        starterCode: (pc) => pc?.css || `#main-title {\n  /* Your CSS here */\n}`,
        validate: (code, pc) => {
            if (!pc?.html || !pc.html.includes("id='main-title'") && !pc.html.includes('id="main-title"')) return {success: false, message: "Add id='main-title' to your <h1> tag in HTML."};
            return validateCSSProperties(code, [{selector: '#main-title', properties: {color: 'blue'}}]);
        },
        expectedOutputPreview: `<h1 id="main-title" style="color:blue;">Title</h1><p>First para.</p><p class="highlight" style="background-color:yellow;">Second para.</p>`
      }
    ],
    unlocksNextLevel: '10',
  },
   {
    id: '10',
    title: 'Font Styling',
    icon: ' شریف ', // Abjad letter for "font" / "writing"
    description: 'Change font family, size, weight, and text alignment.',
    tasks: [
      {
        id: '10.1',
        instruction: "Change the font family for all paragraphs (`<p>`) to `sans-serif`. Use the `font-family` property.",
        language: Language.CSS,
        starterCode: (pc) => pc?.css || `p {\n  /* Your CSS here */\n}`,
        validate: (code) => validateCSSProperties(code, [{selector: 'p', properties: {'font-family': 'sans-serif'}}]),
        expectedOutputPreview: `<p style="font-family: sans-serif;">This is a paragraph.</p>`
      },
      {
        id: '10.2',
        instruction: "Make your `<h1>` (or `#main-title` if you used an ID) have a `font-size` of `32px` and `font-weight` of `bold`.",
        language: Language.CSS,
        starterCode: (pc) => pc?.css || `h1 {\n  /* Your CSS here */\n}`,
        validate: (code) => {
            const h1Check = validateCSSProperties(code, [{selector: 'h1', properties: {'font-size': '32px', 'font-weight':'bold'}}]);
            if (h1Check.success) return h1Check;
            const idCheck = validateCSSProperties(code, [{selector: '#main-title', properties: {'font-size': '32px', 'font-weight':'bold'}}]);
            if (idCheck.success) return idCheck;
            return {success: false, message: "Style either h1 or #main-title with font-size: 32px and font-weight: bold."}
        },
        expectedOutputPreview: `<h1 style="font-size: 32px; font-weight: bold;">Big Bold Title</h1>`
      },
      {
        id: '10.3',
        instruction: "Center-align the text of your `<h1>` (or `#main-title`) using the `text-align` property.",
        language: Language.CSS,
        starterCode: (pc) => pc?.css || `h1 {\n  /* Your CSS here, add to existing if any */\n}`,
        validate: (code) => {
            const h1Check = validateCSSProperties(code, [{selector: 'h1', properties: {'text-align': 'center'}}]);
             if (h1Check.success) return h1Check;
            const idCheck = validateCSSProperties(code, [{selector: '#main-title', properties: {'text-align': 'center'}}]);
            if (idCheck.success) return idCheck;
            return {success: false, message: "Style either h1 or #main-title with text-align: center."}
        },
        expectedOutputPreview: `<h1 style="font-size: 32px; font-weight: bold; text-align: center;">Centered Title</h1>`
      }
    ],
    unlocksNextLevel: '11',
  },
  {
    id: '11',
    title: 'The Box Model',
    icon: '📦',
    description: 'Understand padding, border, and margin, which make up the CSS box model.',
    tasks: [
      {
        id: '11.1',
        instruction: "**Padding** is space inside an element, between its content and its border. Give a `<p>` tag (or a paragraph with a class like `.my-box`) `padding: 10px;`.",
        language: Language.CSS,
        starterCode: (pc) => pc?.css || `p {\n  /* Your CSS here */\n}`,
        validate: (code) => validateCSSProperties(code, [{selector: 'p', properties: {padding: /10px.*/}}]), // Allow for more specific padding later
        expectedOutputPreview: `<p style="padding: 10px; background-color: lightblue; border: 1px solid blue;">Content with padding</p>`
      },
      {
        id: '11.2',
        instruction: "**Border** goes around the padding and content. Style the same element with `border: 2px solid red;`.",
        language: Language.CSS,
        starterCode: (pc) => pc?.css || `p {\n  padding: 10px;\n  /* Your CSS here */\n}`,
        validate: (code) => validateCSSProperties(code, [{selector: 'p', properties: {border: /2px solid red.*/}}]),
        expectedOutputPreview: `<p style="padding: 10px; border: 2px solid red; background-color: lightblue;">Content with padding and border</p>`
      },
      {
        id: '11.3',
        instruction: "**Margin** is space outside the border, clearing an area around the element. Give the same element `margin: 15px;`. Notice how it pushes other elements away.",
        language: Language.CSS,
        starterCode: (pc) => pc?.css || `p {\n  padding: 10px;\n  border: 2px solid red;\n  /* Your CSS here */\n}`,
        validate: (code) => validateCSSProperties(code, [{selector: 'p', properties: {margin: /15px.*/}}]),
        expectedOutputPreview: `<div style="border:1px dashed green;"><p style="padding: 10px; border: 2px solid red; margin: 15px; background-color: lightblue;">Content with padding, border, and margin</p>Another element</div>`
      }
    ],
    unlocksNextLevel: '12',
  },
  {
    id: '12',
    title: 'CSS Units',
    icon: '📏',
    description: 'Learn about different units for specifying sizes and lengths: px, em, rem, %.',
    tasks: [
      {
        id: '12.1',
        instruction: "`px` (pixels) are fixed-size units. You've used them for `font-size` and `border`. Set the `width` of a `div` (you can add one: `<div class='my-div'>Box</div>`) to `200px` and `height` to `100px`. Give it a background color to see it.",
        language: Language.CSS,
        starterCode: (pc) => pc?.css || `.my-div {\n background-color: #eee;\n /* Your CSS here */\n}`,
        validate: (code, pc) => {
            if (!pc?.html || !pc.html.includes("class='my-div'")) return {success: false, message: "Add a div with class='my-div' to your HTML."};
            return validateCSSProperties(code, [{selector: '.my-div', properties: {width: '200px', height: '100px'}}]);
        },
        expectedOutputPreview: `<div class='my-div' style="width: 200px; height: 100px; background-color: lightcoral;">Box</div>`
      },
      {
        id: '12.2',
        instruction: "`%` (percentage) is relative to the parent container's size. If the parent is 500px wide, `width: 50%;` would be 250px. Make your `.my-div` have `width: 50%;` (it will be 50% of the body or its parent).",
        language: Language.CSS,
        starterCode: (pc) => pc?.css || `.my-div {\n background-color: #eee;\n height: 100px;\n /* Change width here */\n}`,
        validate: (code) => validateCSSProperties(code, [{selector: '.my-div', properties: {width: '50%'}}]),
        expectedOutputPreview: `<div style="border:1px solid black; width: 400px;"><div class='my-div' style="width: 50%; height: 100px; background-color: lightcoral;">Box (50% of parent)</div></div>`
      },
      {
        id: '12.3',
        instruction: "`em` is relative to the font-size of the element itself. `1em` is equal to the current font-size. If `font-size: 16px`, then `padding: 1em;` is `16px`. Set `font-size: 20px;` and `padding: 0.5em;` on `.my-div`.",
        longDescription: "`rem` (root em) is relative to the font-size of the root (`html`) element. It's often preferred for consistency.",
        language: Language.CSS,
        starterCode: (pc) => pc?.css || `.my-div {\n background-color: #eee;\n width: 50%;\n height: 100px;\n /* Your CSS here */\n}`,
        validate: (code) => validateCSSProperties(code, [{selector: '.my-div', properties: {'font-size': '20px', padding: '0.5em'}}]),
        expectedOutputPreview: `<div class='my-div' style="width: 50%; height: 100px; font-size: 20px; padding: 10px; background-color: lightcoral;">Box (padding is 0.5em of 20px)</div>`
      }
    ],
    unlocksNextLevel: '13',
  },
  {
    id: '13',
    title: 'Display Property',
    icon: '🧩',
    description: 'Control how elements are displayed: block, inline, inline-block, and none.',
    tasks: [
      {
        id: '13.1',
        instruction: "`display: block;` elements take up the full width available and start on a new line (e.g., `<h1>`, `<p>`, `<div>`). `display: inline;` elements only take up as much width as necessary and do not start on a new line (e.g., `<a>`, `<span>`, `<strong>`). Add two `<span>` elements inside a `<p>`: `<p>First <span>span1</span> and <span>span2</span>.</p>`. Notice they are on the same line.",
        language: Language.HTML, // User modifies HTML
        starterCode: (pc) => pc?.html || `<html>...<body><p><!-- Add spans here --></p></body></html>`,
        validate: (code) => validateHTMLStructure(code, [{tag: 'p'}, {tag: 'span', text:'span1', parentSelector: 'p', count:1}, {tag:'span', text:'span2', parentSelector:'p', count:1}]),
        expectedOutputPreview: `<p>First <span>span1</span> and <span>span2</span>.</p>`
      },
      {
        id: '13.2',
        instruction: "Now, change the `<span>` elements to `display: block;` using CSS. Notice how they now stack vertically.",
        language: Language.CSS,
        starterCode: (pc) => pc?.css || `span {\n  /* Your CSS here */\n}`,
        validate: (code) => validateCSSProperties(code, [{selector: 'span', properties: {display: 'block'}}]),
        expectedOutputPreview: `<p>First <span style="display:block; background-color: #eee;">span1</span> and <span style="display:block; background-color: #ddd;">span2</span>.</p>`
      },
      {
        id: '13.3',
        instruction: "`display: inline-block;` is like `inline` but allows you to set `width` and `height`. Make your spans `display: inline-block;`, `width: 100px;`, `height: 30px;`, and give them a `background-color` to see their bounds.",
        language: Language.CSS,
        starterCode: (pc) => pc?.css || `span {\n  /* Your CSS here */\n  background-color: lightblue;\n}`,
        validate: (code) => validateCSSProperties(code, [{selector: 'span', properties: {display: 'inline-block', width: '100px', height: '30px'}}]),
        expectedOutputPreview: `<p>First <span style="display:inline-block; width:100px; height:30px; background-color: lightblue;">span1</span> and <span style="display:inline-block; width:100px; height:30px; background-color: lightcoral;">span2</span>.</p>`
      },
      {
        id: '13.4',
        instruction: "`display: none;` hides an element completely. Hide the second span using an ID or class selector. For example, add `id='hide-me'` to the second span in HTML, then in CSS: `#hide-me { display: none; }`",
        language: Language.CSS, // User modifies HTML and CSS
        starterCode: (pc) => pc?.css || `#hide-me {\n  /* Your CSS here */\n}`,
        validate: (code, pc) => {
            if(!pc?.html || !pc.html.includes("id='hide-me'") && !pc.html.includes('id="hide-me"')) return {success:false, message: "Add id='hide-me' to the second span."};
            return validateCSSProperties(code, [{selector: '#hide-me', properties: {display: 'none'}}]);
        },
        expectedOutputPreview: `<p>First <span style="display:inline-block; width:100px; height:30px; background-color: lightblue;">span1</span> and <span id="hide-me" style="display:none;">span2</span>.</p>`
      }
    ],
    unlocksNextLevel: '14',
  },
  {
    id: '14',
    title: 'Styling Links',
    icon: '🔗🎨',
    description: 'Change the appearance of links and their states (hover, visited).',
    tasks: [
      {
        id: '14.1',
        instruction: "Style all `<a>` tags to have `color: green;` and remove the underline with `text-decoration: none;`.",
        language: Language.CSS,
        starterCode: (pc) => pc?.css || `a {\n  /* Your CSS here */\n}`,
        validate: (code) => validateCSSProperties(code, [{selector: 'a', properties: {color: 'green', 'text-decoration': 'none'}}]),
        expectedOutputPreview: `<a href="#" style="color: green; text-decoration: none;">A Styled Link</a>`
      },
      {
        id: '14.2',
        instruction: "Use the `:hover` pseudo-class to change a link's style when the mouse is over it. Make links turn `color: red;` and `text-decoration: underline;` on hover. Syntax: `a:hover { ... }`",
        language: Language.CSS,
        starterCode: (pc) => pc?.css || `a {\n  color: green;\n  text-decoration: none;\n}\na:hover {\n  /* Your CSS here */\n}`,
        validate: (code) => validateCSSProperties(code, [{selector: 'a:hover', properties: {color: 'red', 'text-decoration': 'underline'}}]),
        expectedOutputPreview: `<a href="#" style="color: green; text-decoration: none;" onmouseover="this.style.color='red'; this.style.textDecoration='underline';" onmouseout="this.style.color='green'; this.style.textDecoration='none';">Hover over me!</a>`
      }
    ],
    unlocksNextLevel: 'bonus2',
  },
  {
    id: 'bonus2',
    title: 'Bonus: Style Your Page',
    icon: '✨🎨',
    description: 'Apply your CSS knowledge to style the "About Me" page you created earlier.',
    tasks: [
      {
        id: 'b2.1',
        instruction: "Style your 'About Me' page (from Bonus Level 1). Aim to:\n1. Center the main heading (`<h1>`) and change its font family.\n2. Give the page a `background-color` (for the `<body>`).\n3. Style your hobbies list (`<ul>`): remove bullets (`list-style-type: none;`), add some padding to `<li>` items.\n4. Add a border and some margin to your image (`<img>`).\n5. Style any paragraphs with a different `font-size` or `color`.",
        language: Language.CSS,
        starterCode: (pc) => pc?.css || `/* Style your About Me page! */\nbody {\n\n}\nh1 {\n\n}\nul {\n\n}\nli {\n\n}\nimg {\n\n}\np {\n\n}`,
        validate: (code) => {
          // This is a creative task, so validation is more about effort.
          let checksPassed = 0;
          if (code.includes('body') && code.includes('background-color')) checksPassed++;
          if (code.includes('h1') && (code.includes('text-align: center') || code.includes('font-family'))) checksPassed++;
          if (code.includes('ul') && code.includes('list-style-type: none')) checksPassed++;
          if (code.includes('img') && (code.includes('border') || code.includes('margin'))) checksPassed++;
          if (code.includes('p') && (code.includes('font-size') || code.includes('color'))) checksPassed++;
          
          if (checksPassed >= 3) return {success: true, message: "Great styling job!"};
          return {success: false, message: "Try to apply at least 3 of the suggested styles."};
        },
        expectedOutputPreview: `<body style="background-color: #f0f0f0; font-family: Arial, sans-serif; padding:20px;"><header><h1 style="text-align:center; color: #333; font-family: Georgia, serif;">Your Name</h1></header><main><img src='https://via.placeholder.com/100' alt='My Picture' style="border: 3px solid #ccc; margin: 15px; border-radius: 50%; display:block; margin-left:auto; margin-right:auto;"><p style="font-size: 1.1em; color: #555; line-height: 1.6;">A brief description about being very interested in learning to code and creating amazing web experiences.</p><h2 style="color: #444; text-align:center;">My Hobbies:</h2><ul style="list-style-type: none; padding: 0; text-align:center;"><li style="background-color: #e9e9e9; margin: 5px; padding: 10px; border-radius: 5px;">Coding</li><li style="background-color: #e9e9e9; margin: 5px; padding: 10px; border-radius: 5px;">Reading</li><li style="background-color: #e9e9e9; margin: 5px; padding: 10px; border-radius: 5px;">Hiking</li></ul></main><footer><p style="text-align:center; font-size:0.8em; color:#777; margin-top:30px;">My styled page footer</p></footer></body>`
      }
    ],
    unlocksNextLevel: '15',
  },

  // --- JavaScript Basics ---
  {
    id: '15',
    title: 'Intro to JavaScript!',
    icon: '💡',
    description: 'Start learning JavaScript to make your web pages interactive.',
    tasks: [
      {
        id: '15.1',
        instruction: "JavaScript code is usually placed in `<script>` tags, often right before the closing `</body>` tag in HTML, or in external `.js` files. For now, let's use internal scripts. Add `<script></script>` tags inside your `<body>`, after all other HTML content.",
        language: Language.HTML, // User modifies HTML to add script tag
        starterCode: (pc) => pc?.html || `<html><head><title>JS Test</title></head><body><h1>Hello JS!</h1>\n  <!-- Add script tag here -->\n</body></html>`,
        validate: (code) => validateHTMLStructure(code, [{ tag: 'script', parentSelector: 'body' }]),
        expectedOutputPreview: `<h1>Hello JS!</h1> <!-- Script tag is not visible -->`
      },
      {
        id: '15.2',
        instruction: "The `console.log()` function is used to print messages to the browser's developer console (usually F12 to open). Inside your `<script>` tags, write: `console.log('Hello from JavaScript!');`",
        language: Language.JavaScript, // User writes JS within script tags
        starterCode: (pc) => pc?.js || `// Your JS code here`,
        validate: (code) => {
          if (code.includes("console.log('Hello from JavaScript!')") || code.includes('console.log("Hello from JavaScript!")')) {
            return { success: true, message: "Check your browser console (F12)!" };
          }
          return { success: false, message: "Use console.log with the exact message." };
        },
        // No direct visual preview, console output
      }
    ],
    unlocksNextLevel: '16',
  },
  {
    id: '16',
    title: 'Variables & Data Types',
    icon: '📦🏷️',
    description: 'Learn to store data in variables and understand basic data types like strings, numbers, and booleans.',
    tasks: [
      {
        id: '16.1',
        instruction: "Variables store data. Use `let` or `const` to declare them. `let` allows reassignment, `const` doesn't. Declare a variable `message` using `let` and assign it the string value `'Learning JS!'`. Then, `console.log(message);`.",
        language: Language.JavaScript,
        starterCode: `// Declare variable and log it`,
        validate: (code) => {
          if (code.includes('let message') && code.includes("= 'Learning JS!'") && code.includes('console.log(message)')) {
            return { success: true, message: 'Variable declared and logged!' };
          }
          return { success: false, message: "Use `let message = 'Learning JS!';` and log `message`." };
        }
      },
      {
        id: '16.2',
        instruction: "Common data types: **String** (text, e.g., `'hello'`), **Number** (e.g., `10`, `3.14`), **Boolean** (true/false). Declare a variable `myAge` (number) and `isLearning` (boolean, set to `true`). Log both.",
        language: Language.JavaScript,
        starterCode: `let message = 'Learning JS!';\nconsole.log(message);\n\n// Declare myAge and isLearning`,
        validate: (code) => {
          const ageRegex = /(let|const)\s+myAge\s*=\s*\d+/;
          const learningRegex = /(let|const)\s+isLearning\s*=\s*true/;
          if (ageRegex.test(code) && learningRegex.test(code) && code.includes('console.log(myAge)') && code.includes('console.log(isLearning)')) {
            return { success: true, message: 'Variables created!' };
          }
          return { success: false, message: 'Declare `myAge` as a number and `isLearning` as `true`. Log both.' };
        }
      },
      {
        id: '16.3',
        instruction: "You can perform arithmetic operations. Declare two number variables, `num1 = 10` and `num2 = 5`. Create a new variable `sum` that is `num1 + num2`. Log the `sum`.",
        language: Language.JavaScript,
        starterCode: `// Declare numbers and sum`,
        validate: (code) => {
          if (code.match(/(let|const)\s+num1\s*=\s*10/) && code.match(/(let|const)\s+num2\s*=\s*5/) && code.match(/(let|const)\s+sum\s*=\s*num1\s*\+\s*num2/) && code.includes('console.log(sum)')) {
            return { success: true, message: 'Sum calculated and logged!' };
          }
          return { success: false, message: 'Calculate sum of num1 (10) and num2 (5) and log it.' };
        }
      }
    ],
    unlocksNextLevel: '17',
  },
   {
    id: '17',
    title: 'Functions',
    icon: '⚙️',
    description: 'Write reusable blocks of code with functions. Learn about parameters and return values.',
    tasks: [
      {
        id: '17.1',
        instruction: "Functions group code. Define a function `greet` that logs 'Hello there!' to the console. Syntax: `function functionName() { /* code */ }`. Then, call your function: `greet();`.",
        language: Language.JavaScript,
        starterCode: `// Define and call greet function`,
        validate: (code) => {
          if (code.includes('function greet()') && code.includes("console.log('Hello there!')") && code.includes('greet();')) {
            return { success: true, message: 'Function defined and called!' };
          }
          return { success: false, message: "Define `greet` to log 'Hello there!' and then call `greet()`." };
        }
      },
      {
        id: '17.2',
        instruction: "Functions can take **parameters** (inputs). Define `greetUser(name)` that logs `Hello, [name]!`. Call it with your name: `greetUser('YourName');`.",
        language: Language.JavaScript,
        starterCode: `// Define greetUser function with a parameter`,
        validate: (code) => {
          // Regex to check for function definition and call, allowing for different quote types and concatenation
          const funcDefRegex = /function\s+greetUser\s*\(\s*name\s*\)\s*\{[\s\S]*console\.log\s*\(\s*(['"`])Hello, \1\s*\+\s*name\s*\+\s*(['"`])!\1\s*\)\s*;\s*\}/;
          const funcCallRegex = /greetUser\s*\(\s*(['"`])\w+\1\s*\)\s*;/; // Matches greetUser('AnyName');

          if (funcDefRegex.test(code) && funcCallRegex.test(code)) {
            return { success: true, message: 'Parameterized function works!' };
          }
          return { success: false, message: "Define `greetUser(name)` to log 'Hello, ' + name + '!' and call it." };
        }
      },
      {
        id: '17.3',
        instruction: "Functions can **return** a value. Define `add(a, b)` that returns `a + b`. Call it, store the result in a variable, and log the result: `let result = add(5, 3); console.log(result);`.",
        language: Language.JavaScript,
        starterCode: `// Define add function that returns sum`,
        validate: (code) => {
          if (code.includes('function add(a, b)') && code.includes('return a + b') && code.match(/let\s+result\s*=\s*add\(\s*5\s*,\s*3\s*\)/) && code.includes('console.log(result)')) {
            return { success: true, message: 'Function returns value correctly!' };
          }
          return { success: false, message: "Define `add(a,b)` to return `a+b`. Call it with 5 and 3, store and log result." };
        }
      }
    ],
    unlocksNextLevel: '18',
  },
  {
    id: '18',
    title: 'Conditional Logic: If/Else',
    icon: '❓',
    description: 'Make decisions in your code using `if`, `else if`, and `else` statements.',
    tasks: [
      {
        id: '18.1',
        instruction: "The `if` statement runs code if a condition is true. Example: `if (condition) { /* code */ }`. Declare `let temperature = 25;`. If `temperature > 20`, log 'It is warm!'.",
        language: Language.JavaScript,
        starterCode: `let temperature = 25;\n// Add if statement here`,
        validate: (code) => {
          if (code.includes('let temperature = 25;') && code.includes('if (temperature > 20)') && code.includes("console.log('It is warm!')")) {
            return { success: true, message: 'If statement working!' };
          }
          return { success: false, message: "If temperature (25) > 20, log 'It is warm!'." };
        }
      },
      {
        id: '18.2',
        instruction: "Add an `else` block to run code if the `if` condition is false. If `temperature > 20`, log 'Warm'. Else, log 'Cool'. Change `temperature` to 15 and test.",
        language: Language.JavaScript,
        starterCode: `let temperature = 15; // Changed for testing\nif (temperature > 20) {\n  console.log('Warm');\n} // Add else block here`,
        validate: (code) => {
          // This needs to simulate the logic or trust user changed value.
          // For simplicity, we'll check structure assuming temperature could be anything.
          if (code.includes('if (temperature > 20)') && code.includes("console.log('Warm')") && code.includes('else') && code.includes("console.log('Cool')")) {
            return { success: true, message: 'If/else structure is correct!' };
          }
          return { success: false, message: "Add an else block to log 'Cool'." };
        }
      },
       {
        id: '18.3',
        instruction: "You can use comparison operators: `>` (greater), `<` (less), `===` (equal value and type), `!==` (not equal), `>=` (greater/equal), `<=` (less/equal). Declare `let score = 85;`. If `score >= 90` log 'A'. Else if `score >= 80` log 'B'. Else log 'C'.",
        language: Language.JavaScript,
        starterCode: `let score = 85;\n// Add if/else if/else statement`,
        validate: (code) => {
          const ifBlock = code.includes("if (score >= 90)") && code.includes("console.log('A')");
          const elseIfBlock = code.includes("else if (score >= 80)") && code.includes("console.log('B')");
          const elseBlock = code.includes("else") && code.includes("console.log('C')");
          if (ifBlock && elseIfBlock && elseBlock) {
             return { success: true, message: 'Grading logic implemented!' };
          }
          return { success: false, message: 'Implement the if/else if/else grading logic.' };
        }
      }
    ],
    unlocksNextLevel: '19',
  },
  {
    id: '19',
    title: 'DOM Manipulation: Get & Set',
    icon: '🖐️📄',
    description: 'Interact with HTML elements from JavaScript: get elements and change their content.',
    tasks: [
      {
        id: '19.1',
        instruction: "To change an HTML element, you first need to get it. If an element has an ID, e.g., `<h1 id='title'>Text</h1>`, you can get it with `document.getElementById('ID_HERE')`. Get the h1 with `id='title'` and store it in a variable `myTitle`.",
        language: Language.JavaScript,
        starterCode: (pc) => pc?.js || `// Assume HTML has <h1 id="title">Old Title</h1>\n// Get the element here`,
        longDescription: "Make sure your HTML (from a previous step or the current level's setup) has an element like `<h1 id='title'>Old Title</h1>` for this JavaScript to work on. The preview won't update for JS-only tasks unless you also modify the HTML panel with the target element.",
        validate: (code) => {
          if (code.match(/(let|const)\s+myTitle\s*=\s*document\.getElementById\s*\(\s*(['"`])title\2\s*\)/)) {
            return { success: true, message: 'Element selected!' };
          }
          return { success: false, message: "Use `document.getElementById('title')`." };
        },
        expectedOutputPreview: `<h1 id="title">Old Title</h1> <!-- JS will target this -->`
      },
      {
        id: '19.2',
        instruction: "Once you have an element, you can change its text content using the `.textContent` property. Set `myTitle.textContent = 'New Awesome Title!';`.",
        language: Language.JavaScript,
        starterCode: (pc) => pc?.js || `const myTitle = document.getElementById('title');\n// Change its text content here`,
        validate: (code) => {
          if (code.includes("myTitle.textContent = 'New Awesome Title!'") || code.includes('myTitle.textContent = "New Awesome Title!"')) {
            return { success: true, message: 'Text content changed! (Check preview if HTML is set up)' };
          }
          return { success: false, message: "Set `myTitle.textContent` to the new title." };
        },
        expectedOutputPreview: `<h1 id="title" style="color:red;">New Awesome Title!</h1>`
      },
       {
        id: '19.3',
        instruction: "You can also use `querySelector` which is more flexible. It uses CSS selectors. E.g., `document.querySelector('.my-class')` or `document.querySelector('#myId')`. Add a `<p id='info'>Old info</p>` to your HTML. In JS, get it using `querySelector` and change its text to 'Updated Information!'.",
        language: Language.JavaScript,
        starterCode: (pc) => pc?.js || `// Assume HTML has <p id="info">Old info</p>\nconst infoPara = document.querySelector('#info');\n// Change its text content`,
        validate: (code, pc) => {
            if (!pc?.html || !pc.html.includes("id='info'")) return {success: false, message: "Add <p id='info'>Old info</p> to your HTML panel."};
            if (code.includes("infoPara.textContent = 'Updated Information!'") || code.includes('infoPara.textContent = "Updated Information!"')) {
                 if (code.includes("document.querySelector('#info')")) {
                    return { success: true, message: 'querySelector used and text changed!' };
                 }
                 return {success: false, message: "Make sure to select the element using document.querySelector('#info')."}
            }
            return { success: false, message: "Set infoPara.textContent to 'Updated Information!'." };
        },
        expectedOutputPreview: `<h1 id="title">New Awesome Title!</h1><p id="info">Updated Information!</p>`
      }
    ],
    unlocksNextLevel: '20',
  },
  {
    id: '20',
    title: 'Event Listeners: Click!',
    icon: '🖱️👆',
    description: 'Make your page react to user actions, like clicks.',
    tasks: [
      {
        id: '20.1',
        instruction: "To react to a click, add an event listener. First, get a button. Assume HTML: `<button id='myButton'>Click Me</button>`. In JS: `const button = document.getElementById('myButton');`.",
        language: Language.JavaScript,
        starterCode: (pc) => pc?.js || `// Get the button`,
        validate: (code, pc) => {
            if (!pc?.html || !pc.html.includes("id='myButton'")) return {success: false, message: "Add <button id='myButton'>Click Me</button> to your HTML panel."};
            if (code.match(/(let|const)\s+button\s*=\s*document\.getElementById\s*\(\s*(['"`])myButton\2\s*\)/)) {
                return { success: true, message: 'Button selected!' };
            }
            return { success: false, message: "Get element with id 'myButton'." };
        },
        expectedOutputPreview: `<button id='myButton'>Click Me</button>`
      },
      {
        id: '20.2',
        instruction: "Then, add a 'click' listener: `button.addEventListener('click', function() { /* code to run on click */ });`. Make it log 'Button clicked!' to the console when clicked.",
        language: Language.JavaScript,
        starterCode: (pc) => pc?.js || `const button = document.getElementById('myButton');\n// Add event listener here`,
        validate: (code) => {
          // This regex is a bit complex to allow for anonymous or named functions
          const listenerRegex = /button\.addEventListener\s*\(\s*(['"`])click\1\s*,\s*function\s*\(\s*\)\s*\{[\s\S]*console\.log\s*\(\s*(['"`])Button clicked!\2\s*\)\s*;\s*\}\s*\)\s*;/;
          if (listenerRegex.test(code)) {
            return { success: true, message: 'Event listener added! Try clicking the button.' };
          }
          return { success: false, message: "Add a click listener that logs 'Button clicked!'." };
        }
      },
      {
        id: '20.3',
        instruction: "Let's make the click change some text. Assume HTML has `<p id='statusText'>Not clicked yet</p>`. On button click, change this paragraph's text to 'Button was clicked!'.",
        language: Language.JavaScript,
        starterCode: (pc) => pc?.js || `const button = document.getElementById('myButton');\nconst statusP = document.getElementById('statusText');\n\nbutton.addEventListener('click', function() {\n  // Change statusP.textContent here\n});`,
        validate: (code, pc) => {
            if (!pc?.html || !pc.html.includes("id='statusText'")) return {success: false, message: "Add <p id='statusText'>Not clicked yet</p> to HTML."};
            const changeTextRegex = /statusP\.textContent\s*=\s*(['"`])Button was clicked!\1\s*;/;
            if (code.includes("addEventListener('click'") && changeTextRegex.test(code)) {
                 return { success: true, message: 'Text changes on click! Test it.' };
            }
            return { success: false, message: "Inside the click listener, set `statusP.textContent`." };
        },
        expectedOutputPreview: `<button id='myButton'>Click Me</button><p id='statusText'>Not clicked yet</p> <!-- Click button to change text -->`
      }
    ],
    unlocksNextLevel: 'bonus3',
  },
  {
    id: 'bonus3',
    title: 'Bonus: Interactive About Me',
    icon: '🖱️🌟',
    description: 'Add some JavaScript interactivity to your "About Me" page.',
    tasks: [
      {
        id: 'b3.1',
        instruction: "On your 'About Me' page (from Bonus 1 & 2), add a button. When this button is clicked, it should change some text on the page. For example, it could reveal a 'secret fact' in a paragraph that was initially hidden or had different text.",
        longDescription: "You'll need:\n1. A button in your HTML (e.g., `<button id='factButton'>Reveal Fact</button>`).\n2. A paragraph for the fact (e.g., `<p id='secretFact' style='display:none;'>I can speak Klingon!</p>` or `<p id='factDisplay'>Click the button...</p>`).\n3. JavaScript to get the button and paragraph, add an event listener to the button, and on click, change the paragraph's textContent or display style.",
        language: Language.JavaScript,
        starterCode: (pc) => pc?.js || `const factBtn = document.getElementById('factButton');\nconst factP = document.getElementById('factDisplay');\n\nfactBtn.addEventListener('click', function() {\n  // Your logic here\n});`,
        validate: (code, pc) => {
            if (!pc?.html || !pc.html.includes("id='factButton'") || (!pc.html.includes("id='factDisplay'") && !pc.html.includes("id='secretFact'"))) {
                return {success: false, message: "Ensure your HTML has the button and paragraph with specified IDs."}
            }
            if (code.includes("addEventListener('click'") && (code.includes(".textContent =") || code.includes(".style.display ="))) {
                return { success: true, message: "Interactive element added!" };
            }
            return { success: false, message: "Make the button click change text or visibility." };
        },
        expectedOutputPreview: `<h1>Your Name</h1>...<button id='factButton'>Reveal Fact</button><p id='factDisplay'>Click button...</p> <!-- This text will change on click -->`
      }
    ],
    unlocksNextLevel: '21',
  },

  // --- Project: Calculator ---
  {
    id: '21', // Was 8
    title: 'Calc HTML: Structure',
    description: 'Build the full HTML structure for your calculator: display and all buttons.',
    icon: '🧮',
    projectType: 'calculator',
    tasks: [
      {
        id: '21.1',
        instruction: 'Create a main `div` with class `calculator`. Inside, add an `<input type="text" id="display" readonly>` for the screen.',
        language: Language.HTML,
        starterCode: ``,
        validate: (code, projectCode) => {
          const res = validateHTMLStructure(code, [
            { tag: 'div', attributes: { class: 'calculator' } },
            { tag: 'input', attributes: { type: 'text', id: 'display', readonly: "" }, parentSelector: 'div.calculator'},
          ]);
          if (!res.success) return res;
          return { success: true, message: 'Calculator shell created!', updatedProjectCode: { ...projectCode, html: code } };
        },
        expectedOutputPreview: `<div class="calculator" style="border:1px solid #ccc; padding:10px; width:220px; margin: 20px auto; background-color: #f0f0f0; border-radius: 5px;"><input type="text" id="display" readonly style="width:100%; margin-bottom:10px; padding:10px 5px; text-align:right; font-size:1.5em; border-radius:3px; border:1px solid #ddd;"></div>`
      },
      {
        id: '21.2',
        instruction: 'Below the display, add a `div` with class `buttons`. Inside `buttons`, add `<button>` elements for numbers 7, 8, 9 and the operator `+` (plus).',
        language: Language.HTML,
        starterCode: (pc) => pc?.html || `<div class="calculator"><input type="text" id="display" readonly></div>`,
        validate: (code, pc) => {
          const displayInput = `<input type="text" id="display" readonly`; // More robust check
          if (!code.includes(displayInput)) return { success: false, message: "Keep the display input!" };
          
          const P = new DOMParser();
          const D = P.parseFromString(code, 'text/html');
          if(!D.querySelector('div.calculator div.buttons')) return {success: false, message: 'Missing div with class `buttons` inside `.calculator`.'};
          const buttons = D.querySelectorAll('div.buttons button');
          const texts = Array.from(buttons).map(b => b.textContent?.trim());
          if (!texts.includes('7') || !texts.includes('8') || !texts.includes('9') || !texts.includes('+')) {
            return { success: false, message: 'Missing buttons for 7, 8, 9, or +.' };
          }
          return { success: true, message: 'Number and operator buttons added!', updatedProjectCode: { ...pc, html: code } };
        },
        expectedOutputPreview: `<div class="calculator" style="border:1px solid #ccc; padding:10px; width:220px; margin: 20px auto; background-color: #f0f0f0; border-radius: 5px;"><input type="text" id="display" readonly style="width:100%; margin-bottom:10px; padding:10px 5px; text-align:right; font-size:1.5em; border-radius:3px; border:1px solid #ddd;"><div class="buttons" style="display:grid; grid-template-columns: repeat(4, 1fr); gap:5px;"><button style="padding:10px;">7</button><button style="padding:10px;">8</button><button style="padding:10px;">9</button><button style="padding:10px; background-color:#ff9800; color:white;">+</button></div></div>`
      },
      {
        id: '21.3',
        instruction: 'Complete the button layout. Add buttons for 4, 5, 6, - (minus); 1, 2, 3, * (multiply); C (clear), 0, = (equals), / (divide). Arrange them in a grid-like fashion (the CSS will handle the grid later, just get the buttons in order).',
        language: Language.HTML,
        starterCode: (pc) => pc?.html || `<div class="calculator"><input type="text" id="display" readonly><div class="buttons"><button>7</button>...</div></div>`,
        validate: (code, pc) => {
          const P = new DOMParser();
          const D = P.parseFromString(code, 'text/html');
          const buttons = D.querySelectorAll('div.buttons button');
          const texts = Array.from(buttons).map(b => b.textContent?.trim());
          const requiredButtons = ['7','8','9','+','4','5','6','-','1','2','3','*','C','0','=','/'];
          for(const req of requiredButtons) {
            if (!texts.includes(req)) return { success: false, message: `Missing button: ${req}`};
          }
          if (buttons.length < 16) return { success: false, message: 'You need at least 16 buttons for all numbers and operations.'};
          return { success: true, message: 'All calculator buttons added!', updatedProjectCode: { ...pc, html: code } };
        },
        expectedOutputPreview: `See preview in next CSS level for full layout.` // Too complex for simple HTML string here
      }
    ],
    unlocksNextLevel: '22',
  },
  {
    id: '22', // Was 9
    title: 'Calc CSS: Styling',
    description: 'Style your calculator: layout for display and buttons, colors, and spacing.',
    icon: '💅🧮',
    projectType: 'calculator',
    tasks: [
      {
        id: '22.1',
        instruction: "Style the `.calculator` div: `width: 250px; margin: 50px auto; border: 1px solid #ccc; padding: 15px; border-radius: 5px; background-color: #f0f0f0; box-shadow: 0 0 10px rgba(0,0,0,0.1);`.",
        language: Language.CSS,
        starterCode: (pc) => pc?.css || `.calculator {\n\n}\n#display {\n\n}\n.buttons {\n\n}\n.buttons button {\n\n}`,
        validate: (code, pc) => {
          const res = validateCSSProperties(code, [{selector: '.calculator', properties: {
            width: '250px', 
            margin: /50px auto.*/, // allow for just 'auto' if they simplify
            border: /1px solid #ccc.*/,
            padding: '15px',
            'border-radius': '5px',
            'background-color': '#f0f0f0'
          }}]);
          if (!res.success) return res;
          return { success: true, message: 'Calculator container styled!', updatedProjectCode: { ...pc, css: code } };
        },
      },
      {
        id: '22.2',
        instruction: "Style the `#display` input: `width: 100%; margin-bottom: 10px; padding: 10px 5px; font-size: 1.8em; text-align: right; border: 1px solid #ddd; border-radius: 3px; box-sizing: border-box;` (`box-sizing` helps with padding and border width).",
        language: Language.CSS,
        starterCode: (pc) => pc?.css || `.calculator { ... }\n#display {\n\n}`,
        validate: (code, pc) => {
            const res = validateCSSProperties(code, [{selector: '#display', properties: {
                width: '100%',
                'margin-bottom': '10px',
                padding: /10px 5px.*/,
                'font-size': /1\.8em/,
                'text-align': 'right',
                'box-sizing': 'border-box'
            }}]);
            if (!res.success) return res;
            return { success: true, message: 'Display styled!', updatedProjectCode: { ...pc, css: code } };
        }
      },
      {
        id: '22.3',
        instruction: "Style the `.buttons` div to be a grid: `display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;` This creates 4 equal columns with 10px gap.",
        language: Language.CSS,
        starterCode: (pc) => pc?.css || `.calculator { ... }\n#display { ... }\n.buttons {\n\n}`,
        validate: (code, pc) => {
           const res = validateCSSProperties(code, [{selector: '.buttons', properties: {
                display: 'grid',
                'grid-template-columns': /repeat\(4,\s*1fr\)/,
                gap: '10px'
            }}]);
            if (!res.success) return res;
            return { success: true, message: 'Button grid layout created!', updatedProjectCode: { ...pc, css: code } };
        }
      },
      {
        id: '22.4',
        instruction: "Style all `.buttons button`: `padding: 15px; font-size: 1.2em; border: 1px solid #ccc; border-radius: 3px; background-color: #fff; cursor: pointer; transition: background-color 0.2s;`. Add a hover effect: `.buttons button:hover { background-color: #eee; }`.",
        language: Language.CSS,
        starterCode: (pc) => pc?.css || `.calculator { ... } ...\n.buttons button {\n\n}\n.buttons button:hover {\n\n}`,
        validate: (code, pc) => {
            const btnStyle = validateCSSProperties(code, [{selector: '.buttons button', properties: {
                padding: '15px',
                'font-size': /1\.2em/,
                'background-color': '#fff', // or #ffffff
                cursor: 'pointer'
            }}]);
            if (!btnStyle.success) return btnStyle;
            const hoverStyle = validateCSSProperties(code, [{selector: '.buttons button:hover', properties: {'background-color': '#eee'}}]);
            if (!hoverStyle.success) return hoverStyle;
            return { success: true, message: 'Buttons styled!', updatedProjectCode: { ...pc, css: code } };
        }
      },
      {
        id: '22.5',
        instruction: "Give operator buttons (+, -, *, /) a different background color (e.g. `#ff9800` and `color: white;`). You might need to add a class like `.operator` to these buttons in HTML, then style `.operator` in CSS. The `=` button can also have a special style (e.g. class `.equals`, background `#4CAF50`). The `C` button (class `.clear`) can be styled too (e.g. background `#f44336`).",
        language: Language.CSS, // User might need to modify HTML too for classes
        longDescription:"HTML might need changes like: `<button class='operator'>+</button>`",
        starterCode: (pc) => pc?.css || `... .buttons button { ... }\n.operator {\n background-color: #ff9800;\n color: white;\n}\n.equals {\n /* style for equals */\n}\n.clear {\n /* style for clear */\n}`,
        validate: (code, pc) => {
            // Basic check, assumes user adds classes to HTML.
            let operatorStyled = false;
            try { if (validateCSSProperties(code, [{selector:'.operator', properties:{'background-color': /#ff9800|orange/i}}]).success) operatorStyled = true; } catch(e){}
            if (!operatorStyled && !validateCSSProperties(code, [{selector:'button[value="+"]', properties:{'background-color': /#ff9800|orange/i}}]).success ) { // If they used attribute selectors
                 // Allow for direct styling of text content if they didn't use classes
                 // This validation is complex without parsing HTML and CSS together.
                 // For now, just check if .operator or .equals or .clear styles are present
            }
             if (code.includes('.operator') && code.includes('.equals') && code.includes('.clear')) {
                return { success: true, message: 'Special buttons styled! Make sure to add classes in HTML.', updatedProjectCode: { ...pc, css: code } };
             }
             return {success: false, message: "Define CSS for .operator, .equals, and .clear classes."};
        }
      }
    ],
    unlocksNextLevel: '23',
  },
   {
    id: '23', // Was 10 (partially)
    title: 'Calc JS: Number Input',
    description: 'Make number buttons (0-9) and decimal point append their value to the display.',
    icon: '⚡🔢',
    projectType: 'calculator',
    tasks: [
      {
        id: '23.1',
        instruction: "Get the display element: `const display = document.getElementById('display');`. Get all number buttons. It's easiest if they share a class, e.g., `.number`. If not, you can select all buttons inside `.buttons` that aren't operators/clear/equals or select them individually.",
        longDescription: "Tip: Add `class='number'` to all your 0-9 buttons and '.' button in HTML. Then `const numberButtons = document.querySelectorAll('.number');`.",
        language: Language.JavaScript,
        starterCode: (pc) => pc?.js || `const display = document.getElementById('display');\n// Get number buttons here`,
        validate: (code, pc) => {
          if (!code.includes("document.getElementById('display')")) return {success: false, message: "Get the display element."};
          if (!code.includes("querySelectorAll('.number')") && !code.includes("querySelectorAll('button')")) return {success: false, message: "Select number buttons (e.g. with querySelectorAll and a class like '.number'). Ensure HTML has these classes."};
          return { success: true, message: 'Display and buttons selected (make sure HTML classes are set).', updatedProjectCode: { ...pc, js: code } };
        }
      },
      {
        id: '23.2',
        instruction: "Loop through `numberButtons`. Add a click event listener to each. Inside the listener, append the button's `textContent` to `display.value`. So, if display shows '12' and '3' is clicked, it becomes '123'. `display.value += button.textContent;`",
        language: Language.JavaScript,
        starterCode: (pc) => pc?.js || `const display = document.getElementById('display');\nconst numberButtons = document.querySelectorAll('.number'); // Assuming class 'number' on digit buttons\n\nnumberButtons.forEach(button => {\n  // Add event listener here\n});`,
        validate: (code, pc) => {
          if (!code.includes("addEventListener('click'") || !code.includes("display.value += ") && !code.includes("display.value = display.value + ")) {
             return { success: false, message: "Add click listener to number buttons to append text to display.value." };
          }
          if (!code.includes("forEach(button =>")) return {success: false, message: "Iterate over numberButtons using forEach."};
          return { success: true, message: 'Number input logic added!', updatedProjectCode: { ...pc, js: code } };
        }
      },
      {
        id: '23.3',
        instruction: "Handle the decimal point: ensure only one decimal can be added to the current number. If `display.value` already includes '.', don't add another one if '.' is clicked.",
        language: Language.JavaScript,
        starterCode: (pc) => pc?.js || `...forEach(button => {\n  button.addEventListener('click', () => {\n    if (button.textContent === '.' && display.value.includes('.')) {\n      return; // Already has a decimal\n    }\n    display.value += button.textContent;\n  });\n});`,
        validate: (code, pc) => {
          if (code.includes("display.value.includes('.')") && code.includes("button.textContent === '.'")) {
            return { success: true, message: 'Decimal point handling looks good!', updatedProjectCode: { ...pc, js: code } };
          }
          return { success: false, message: "Check if display already has '.' before adding another." };
        }
      }
    ],
    unlocksNextLevel: '24',
  },
  {
    id: '24',
    title: 'Calc JS: Operators & Logic',
    description: 'Handle operator clicks (+, -, *, /) and store first number and operator for calculation.',
    icon: '⚡➕➖',
    projectType: 'calculator',
    tasks: [
      {
        id: '24.1',
        instruction: "Declare variables to store the `firstOperand`, `operator`, and `waitingForSecondOperand` (a boolean). Get all operator buttons (e.g., class `.operator`).",
        language: Language.JavaScript,
        starterCode: (pc) => pc?.js || `const display = document.getElementById('display'); // Assuming display is already obtained\nlet firstOperand = null;\nlet operator = null;\nlet waitingForSecondOperand = false;\n\nconst operatorButtons = document.querySelectorAll('.operator'); // Add class to HTML operators\n`,
        validate: (code, pc) => {
          if (!code.includes('let firstOperand') || !code.includes('let operator') || !code.includes('let waitingForSecondOperand')) return {success: false, message: "Declare the state variables."};
          if (!code.includes("querySelectorAll('.operator')")) return {success: false, message: "Select operator buttons (ensure HTML has class '.operator')."};
          return { success: true, message: 'State variables and operator buttons set up!', updatedProjectCode: { ...pc, js: code } };
        }
      },
      {
        id: '24.2',
        instruction: "When an operator button is clicked: \n1. If `firstOperand` is null, set `firstOperand = parseFloat(display.value);`.\n2. Else (if `firstOperand` exists and an operator was already clicked), perform calculation (we'll do this in next step), update display, then set `firstOperand` to the result.\n3. Set `operator = button.textContent;`.\n4. Set `waitingForSecondOperand = true;` (so next number input clears display or starts new number).",
        language: Language.JavaScript,
        starterCode: (pc) => pc?.js || `// Assuming state variables and operatorButtons are defined\noperatorButtons.forEach(button => {\n  button.addEventListener('click', () => {\n    const currentOperator = button.textContent;\n    if (operator && waitingForSecondOperand) { // chained operator\n      operator = currentOperator;\n      return;\n    }\n    if (firstOperand === null) {\n      firstOperand = parseFloat(display.value);\n    } else if (operator) {\n      // Perform calculation (next step)\n      // const result = calculate(firstOperand, parseFloat(display.value), operator);\n      // display.value = String(result);\n      // firstOperand = result;\n      console.log('Calculation would happen here');\n    }\n    operator = currentOperator;\n    waitingForSecondOperand = true;\n  });\n});`,
        validate: (code, pc) => {
            if (!code.includes("firstOperand = parseFloat(display.value)") && !code.includes("firstOperand = Number(display.value)") ) return {success: false, message: "Convert display value to number for firstOperand."};
            if (!code.includes("operator = button.textContent") && !code.includes("operator = currentOperator")) return {success: false, message: "Store the clicked operator."};
            if (!code.includes("waitingForSecondOperand = true")) return {success: false, message: "Set waitingForSecondOperand flag."};
            return { success: true, message: 'Operator click logic initiated!', updatedProjectCode: { ...pc, js: code } };
        }
      },
      {
        id: '24.3',
        instruction: "Modify number input: If `waitingForSecondOperand` is true, set `display.value = button.textContent;` (start new number) and `waitingForSecondOperand = false;`. Else, append as before.",
        language: Language.JavaScript,
        starterCode: (pc) => pc?.js || `// Assuming numberButtons and waitingForSecondOperand are defined\n// numberButtons.forEach(button => { button.addEventListener('click', () => { ...\n    if (waitingForSecondOperand) {\n      display.value = button.textContent;\n      waitingForSecondOperand = false;\n    } else {\n      // Append or set display.value (existing logic)\n      if (display.value === '0' && button.textContent !== '.') { // Avoid leading zero unless it's for decimal\n        display.value = button.textContent;\n      } else {\n        display.value += button.textContent;\n      }\n    }\n// ... }); });`,
        validate: (code, pc) => {
          if (code.includes("if (waitingForSecondOperand)") && code.includes("display.value = button.textContent") && code.includes("waitingForSecondOperand = false")) {
             return { success: true, message: 'Handling new number after operator is good!', updatedProjectCode: { ...pc, js: code } };
          }
          return { success: false, message: "If waitingForSecondOperand, clear display with new digit and reset flag." };
        }
      }
    ],
    unlocksNextLevel: '25',
  },
  {
    id: '25',
    title: 'Calc JS: Equals & Clear',
    description: 'Implement the equals (=) button to perform calculations and the clear (C) button.',
    icon: '⚡🟰🧹',
    projectType: 'calculator',
    tasks: [
      {
        id: '25.1',
        instruction: "Create a `calculate(num1, num2, op)` function. It takes two numbers and an operator string ('+', '-', '*', '/'). It should return the result. Use a `switch` statement or `if/else if` for the operator.",
        language: Language.JavaScript,
        starterCode: (pc) => pc?.js || `function calculate(num1, num2, op) {\n  // switch or if/else if here\n  // return result;\n}`,
        validate: (code, pc) => {
          if (!code.includes("function calculate(num1, num2, op)") || (!code.includes("switch (op)") && !code.includes("if (op ==="))) return {success: false, message: "Create calculate function with switch or if/else for operators."};
          if (!code.includes("return") || !code.includes("+") || !code.includes("-") || !code.includes("*") || !code.includes("/")) return {success: false, message: "Ensure all ops are handled and a value is returned."};
          return { success: true, message: 'Calculate function defined!', updatedProjectCode: { ...pc, js: code } };
        }
      },
      {
        id: '25.2',
        instruction: "Handle the Equals button (`.equals` class). When clicked: if `operator` and `firstOperand` exist, calculate `result = calculate(firstOperand, parseFloat(display.value), operator)`. Set `display.value = String(result)`. Reset `firstOperand = null`, `operator = null` (or `firstOperand = result` if you want to chain operations from the result, but simple reset is fine for now).",
        language: Language.JavaScript,
        starterCode: (pc) => pc?.js || `const equalsButton = document.querySelector('.equals');\n equalsButton.addEventListener('click', () => {\n  if (operator && firstOperand !== null) {\n    // Calculate and update display\n    // Reset state\n  }\n});`,
        validate: (code, pc) => {
          if (!code.includes("document.querySelector('.equals')")) return {success: false, message: "Select the equals button."};
          if (!code.includes("calculate(firstOperand") || !code.includes("display.value = String(result)")) return {success: false, message: "Call calculate and update display on equals."};
          if (!code.includes("firstOperand = null") || !code.includes("operator = null")) return {success: false, message: "Reset state after equals."};
          return { success: true, message: 'Equals button logic implemented!', updatedProjectCode: { ...pc, js: code } };
        }
      },
      {
        id: '25.3',
        instruction: "Handle the Clear button (`.clear` class or 'C'). When clicked, reset `display.value = '0'` (or empty), `firstOperand = null`, `operator = null`, `waitingForSecondOperand = false`.",
        language: Language.JavaScript,
        starterCode: (pc) => pc?.js || `const clearButton = document.querySelector('.clear');\nclearButton.addEventListener('click', () => {\n  // Reset everything\n});`,
        validate: (code, pc) => {
          if (!code.includes("document.querySelector('.clear')")) return {success: false, message: "Select the clear button."};
          if (!code.includes("display.value = ") || !code.includes("firstOperand = null") || !code.includes("operator = null") || !code.includes("waitingForSecondOperand = false")) {
            return { success: false, message: "Reset all calculator state on clear." };
          }
          return { success: true, message: 'Clear button working!', updatedProjectCode: { ...pc, js: code } };
        }
      }
    ],
    unlocksNextLevel: 'bonus4',
  },
  {
    id: 'bonus4',
    title: 'Bonus: Calc Enhancements',
    icon: '✨🧮',
    description: 'Add more features like backspace, keyboard support, or percentage.',
    tasks: [
      {
        id: 'b4.1',
        instruction: "Choose one enhancement: \n1. **Backspace Button**: Add a 'DEL' button that removes the last character from `display.value` (`display.value = display.value.slice(0, -1);`).\n2. **Keyboard Support**: Listen for keyboard presses (`document.addEventListener('keydown', event => { ... })`) and trigger button clicks or logic if a number/operator key is pressed (`event.key`).\n3. **Percentage Button (%)**: Calculates percentage (e.g., `display.value = parseFloat(display.value) / 100;`).",
        language: Language.JavaScript,
        starterCode: (pc) => pc?.js || `// Implement one enhancement\n// Example for Backspace:\n// const backspaceButton = document.getElementById('backspace'); // (add to HTML)\n// backspaceButton.addEventListener('click', () => { display.value = display.value.slice(0,-1); });`,
        validate: (code) => {
          const backspace = code.includes("display.value.slice(0, -1)");
          const keyboard = code.includes("document.addEventListener('keydown'") && code.includes("event.key");
          const percentage = code.includes("parseFloat(display.value) / 100");
          if (backspace || keyboard || percentage) {
            return {success: true, message: "Enhancement implemented!"};
          }
          return {success: false, message: "Try to implement one of the suggested enhancements."};
        }
      }
    ],
    unlocksNextLevel: '26',
  },

  // --- Project: Amazon Clone (Simplified) ---
  {
    id: '26', // Was 15
    title: 'Store HTML: Page Layout',
    description: 'Start building an e-commerce page. HTML for header, product grid area, and footer.',
    icon: '🛍️',
    projectType: 'amazon_clone',
    tasks: [
      {
        id: '26.1',
        instruction: "Create the main page structure: `<header>`, `<main>`, and `<footer>`. Inside `<header>`, add a `div` for a logo (e.g., `<div class='logo'>GuroStore</div>`) and a `div` for a search bar placeholder (e.g., `<input type='search' placeholder='Search products...'>`). Add basic nav links too (e.g., `<a>Deals</a>`, `<a>Account</a>`, `<a>Cart</a>`).",
        language: Language.HTML,
        starterCode: `<html><head><title>GuroStore</title></head><body>\n<!-- Structure Here -->\n</body></html>`,
        validate: (code, pc) => {
          const P = new DOMParser();
          const D = P.parseFromString(code, 'text/html');
          if (!D.querySelector('header .logo') || !D.querySelector('header input[type="search"]')) return {success:false, message:"Header needs a logo div and search input."};
          if (D.querySelectorAll('header a').length < 2) return {success:false, message:"Add at least two nav links in header."};
          if (!D.querySelector('main') || !D.querySelector('footer')) return {success:false, message:"Missing main or footer."};
          return { success: true, message: 'Basic page layout looks good.', updatedProjectCode: { ...pc, html: code } };
        },
        expectedOutputPreview: `<header style="background:#232f3e; color:white; padding:10px 20px; display:flex; justify-content:space-between; align-items:center;"><div class="logo" style="font-size:1.5em; font-weight:bold;">GuroStore</div><div><input type="search" placeholder="Search products..." style="padding:5px; border-radius:3px; border:none; width:300px;"><button style="padding:5px 10px; background:#febd69; border:none; border-radius:3px; margin-left:5px; color:#111;">Go</button></div><nav><a href="#" style="color:white; margin:0 10px; text-decoration:none;">Deals</a><a href="#" style="color:white; margin:0 10px; text-decoration:none;">Account</a><a href="#" style="color:white; margin:0 10px; text-decoration:none;">Cart</a></nav></header><main style="padding:20px;"><h2 style="text-align:center;">Products will show here</h2></main><footer style="background:#131a22; color:white; text-align:center; padding:20px;">&copy; GuroStore</footer>`
      },
      {
        id: '26.2',
        instruction: "Inside `<main>`, add a `<h2>Featured Products</h2>` and a `div` with class `product-grid` where product cards will go.",
        language: Language.HTML,
        starterCode: (pc) => pc?.html || `...<main>\n<!-- Add content here -->\n</main>...`,
        validate: (code, pc) => {
          const P = new DOMParser();
          const D = P.parseFromString(code, 'text/html');
          if (!D.querySelector('main h2') || !D.querySelector('main div.product-grid')) return {success: false, message: "Main section needs H2 and div.product-grid."};
          return { success: true, message: 'Product grid area added.', updatedProjectCode: { ...pc, html: code } };
        }
      }
    ],
    unlocksNextLevel: '27',
  },
  {
    id: '27',
    title: 'Store CSS: Basic Styling',
    description: 'Style the header, footer, and set up basic product card appearance.',
    icon: '💅🛍️',
    projectType: 'amazon_clone',
    tasks: [
      {
        id: '27.1',
        instruction: "Style the `<header>`: `background-color: #232f3e; color: white; padding: 10px 20px; display: flex; justify-content: space-between; align-items: center;`. Style header links: `color: white; text-decoration: none; margin: 0 10px;`.",
        language: Language.CSS,
        starterCode: (pc) => pc?.css || `body { margin:0; font-family: Arial, sans-serif; }\nheader {\n\n}\nheader a {\n\n}\n.logo {\n font-size: 1.5em; font-weight: bold;\n}\nheader input[type="search"] {\n padding: 8px; border-radius: 3px; border: none; width: 300px;\n}`,
        validate: (code, pc) => {
          const headerStyled = validateCSSProperties(code, [{'selector':'header', properties:{'background-color':'#232f3e', 'display':'flex'}}]);
          if (!headerStyled.success) return headerStyled;
          const linkStyled = validateCSSProperties(code, [{'selector':'header a', properties:{'color':'white', 'text-decoration':'none'}}]);
          if(!linkStyled.success) return linkStyled;
          return { success: true, message: 'Header styled!', updatedProjectCode: { ...pc, css: code } };
        }
      },
      {
        id: '27.2',
        instruction: "Style the `<footer>`: `background-color: #131a22; color: white; text-align: center; padding: 20px; margin-top: 30px;`.",
        language: Language.CSS,
        starterCode: (pc) => pc?.css || `... footer {\n\n}`,
        validate: (code, pc) => {
          const footerStyled = validateCSSProperties(code, [{'selector':'footer', properties:{'background-color':'#131a22', 'text-align':'center'}}]);
          if (!footerStyled.success) return footerStyled;
          return { success: true, message: 'Footer styled!', updatedProjectCode: { ...pc, css: code } };
        }
      },
      {
        id: '27.3',
        instruction: "Style the `.product-grid`: `display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; padding: 20px;`. This makes a responsive grid.",
        language: Language.CSS,
        starterCode: (pc) => pc?.css || `... .product-grid {\n\n}`,
        validate: (code, pc) => {
            const gridStyled = validateCSSProperties(code, [{'selector':'.product-grid', properties:{'display':'grid', 'grid-template-columns': /repeat\(auto-fill,\s*minmax\(200px,\s*1fr\)\)/i, 'gap':'20px'}}]);
            if (!gridStyled.success) return gridStyled;
            return { success: true, message: 'Product grid layout ready!', updatedProjectCode: { ...pc, css: code } };
        }
      },
      {
        id: '27.4',
        instruction: "Create basic styling for a `.product-card` (you'll add these cards with JS later, but style it now): `border: 1px solid #ddd; border-radius: 4px; padding: 15px; text-align: center; background-color: white;`. Add a placeholder `.product-card` to your HTML inside `.product-grid` to see your styles.",
        language: Language.CSS, // User may add placeholder HTML
        starterCode: (pc) => pc?.css || `.product-card {\n\n}`,
        validate: (code, pc) => {
            if (!pc?.html || !pc.html.includes('class="product-card"')) return {success: false, message:"Add a placeholder <div class='product-card'> to HTML to see styles."}
            const cardStyled = validateCSSProperties(code, [{'selector':'.product-card', properties:{'border':/1px solid #ddd/i, 'background-color':/white|#fff|#ffffff/i }}]);
            if (!cardStyled.success) return cardStyled;
            return { success: true, message: 'Product card styled!', updatedProjectCode: { ...pc, css: code } };
        }
      }
    ],
    unlocksNextLevel: '28',
  },
  {
    id: '28',
    title: 'Store JS: Dynamic Products',
    description: 'Use JavaScript to create product cards dynamically from an array of data.',
    icon: '⚡🛍️',
    projectType: 'amazon_clone',
    tasks: [
      {
        id: '28.1',
        instruction: "Create a JavaScript array `productsData` with a few product objects. Each object should have `id`, `name`, `price`, and `imageUrl`. E.g., `{ id: 1, name: 'Cool T-Shirt', price: 19.99, imageUrl: 'https://via.placeholder.com/150/FF0000/FFFFFF?Text=T-Shirt' }`.",
        language: Language.JavaScript,
        starterCode: (pc) => pc?.js || `const productsData = [\n  // Add product objects here\n];`,
        validate: (code, pc) => {
          if (!code.includes('const productsData = [') || !code.includes('name:') || !code.includes('price:') || !code.includes('imageUrl:')) return {success: false, message: "Create productsData array with product objects (name, price, imageUrl)."};
          return { success: true, message: 'Product data created!', updatedProjectCode: { ...pc, js: code } };
        }
      },
      {
        id: '28.2',
        instruction: "Get the `.product-grid` div. Loop through `productsData`. For each product, create HTML string for a product card (e.g., `<div class='product-card'>...</div>`). Include `<img>`, product name, and price. Append this HTML to `productGrid.innerHTML`.",
        language: Language.JavaScript,
        starterCode: (pc) => pc?.js || `const productsData = []; // Initialize if not present\nconst productGrid = document.querySelector('.product-grid');\nproductGrid.innerHTML = ''; // Clear existing\n\nproductsData.forEach(product => {\n  // Create card HTML and append\n});`,
        validate: (code, pc) => {
          if (!code.includes("document.querySelector('.product-grid')")) return {success: false, message: "Select .product-grid."};
          if (!code.includes("forEach(product =>") || !code.includes("productGrid.innerHTML += ") && !code.includes(".insertAdjacentHTML(")) return {success: false, message: "Loop through data and append HTML to grid."};
          if (!code.includes("<div class='product-card'>") && !code.includes('<div class="product-card">')) return {success: false, message: "Generated HTML should include a div with class 'product-card'."};
          if (!code.includes("product.name") || !code.includes("product.price") || !code.includes("product.imageUrl")) return {success: false, message: "Use product properties in the card HTML."};
          return { success: true, message: 'Products rendered dynamically!', updatedProjectCode: { ...pc, js: code } };
        },
        expectedOutputPreview: `<!-- Product grid will be filled by JS. Ensure your CSS for .product-card is active. -->`
      }
    ],
    unlocksNextLevel: '29',
  },
  {
    id: '29',
    title: 'Store CSS: Responsiveness',
    description: 'Make your product grid and layout adapt to different screen sizes using CSS media queries.',
    icon: '📱💻🛍️',
    projectType: 'amazon_clone',
    tasks: [
      {
        id: '29.1',
        instruction: "Media queries apply CSS based on screen size. Syntax: `@media (max-width: 768px) { /* CSS for screens <= 768px wide */ }`. For smaller screens (e.g., `max-width: 768px`), make the header's search bar take more width or stack elements differently.",
        language: Language.CSS,
        starterCode: (pc) => pc?.css || `header { /* ...existing styles... */ }\n\n@media (max-width: 768px) {\n  header input[type="search"] {\n    width: 150px; /* Example, adjust as needed */\n  }\n  /* You might hide some nav links or make logo smaller */\n}`,
        validate: (code, pc) => {
          if (!code.includes("@media (max-width: 768px)") && !code.includes("@media screen and (max-width: 768px)")) return {success: false, message: "Add a media query for max-width: 768px."};
          if (!code.includes("header input[type=\"search\"]") && !code.includes("header nav")) return {success: false, message: "Target some header elements within the media query."};
          return { success: true, message: 'Basic responsive header styles added!', updatedProjectCode: { ...pc, css: code } };
        }
      },
      {
        id: '29.2',
        instruction: "The `.product-grid` already uses `repeat(auto-fill, minmax(200px, 1fr))` which is somewhat responsive. For very small screens (e.g., `max-width: 480px`), you might want to ensure product cards are single column: `grid-template-columns: 1fr;`.",
        language: Language.CSS,
        starterCode: (pc) => pc?.css || `.product-grid { /* ...existing styles... */ }\n\n@media (max-width: 480px) {\n  .product-grid {\n    /* Your CSS here */\n  }\n}`,
        validate: (code, pc) => {
          if (!code.includes("@media (max-width: 480px)")) return {success: false, message: "Add a media query for max-width: 480px."};
          if (!code.includes(".product-grid") || !code.includes("grid-template-columns: 1fr")) return {success: false, message: "Make product grid single column in this media query."};
          return { success: true, message: 'Product grid adapted for small screens!', updatedProjectCode: { ...pc, css: code } };
        }
      }
    ],
    unlocksNextLevel: '30',
  },
  {
    id: '30',
    title: 'Store JS: Add to Cart',
    description: 'Implement a basic "Add to Cart" button that updates a counter (client-side only).',
    icon: '🛒➕🛍️',
    projectType: 'amazon_clone',
    tasks: [
      {
        id: '30.1',
        instruction: "Add an 'Add to Cart' button to each product card generated by JS. Give it a class e.g. `add-to-cart-btn` and a `data-product-id` attribute with the product's ID: `<button class='add-to-cart-btn' data-product-id='${product.id}'>Add to Cart</button>`.",
        language: Language.JavaScript, // Modifies JS product card template
        starterCode: (pc) => pc?.js || `// Assuming productsData and productGrid are defined\nproductsData.forEach(product => {\n  const cardHTML = \`\n    <div class='product-card'>\n      <img src='\${product.imageUrl}' alt='\${product.name}' style='width:100%;max-width:150px;height:auto;'>\n      <h3>\${product.name}</h3>\n      <p>$ \${product.price.toFixed(2)}</p>\n      <!-- Add button here -->\n    </div>\n  \`;\n  productGrid.innerHTML += cardHTML;\n});`,
        validate: (code, pc) => {
          if (!code.includes("class='add-to-cart-btn'") && !code.includes('class="add-to-cart-btn"')) return {success: false, message: "Add button with class 'add-to-cart-btn'."};
          if (!code.includes("data-product-id='${product.id}'") && !code.includes('data-product-id="${product.id}"')) return {success: false, message: "Button needs data-product-id attribute."};
          return { success: true, message: '"Add to Cart" button added to template!', updatedProjectCode: { ...pc, js: code } };
        }
      },
      {
        id: '30.2',
        instruction: "After rendering all products, get all `.add-to-cart-btn`s. Add click listeners. When clicked, `console.log('Added product ID:', button.dataset.productId);`. Also, update a cart counter displayed somewhere (e.g., in header `<span id='cart-count'>0</span>`).",
        language: Language.JavaScript,
        starterCode: (pc) => pc?.js || `// After product rendering loop \nconst cartButtons = document.querySelectorAll('.add-to-cart-btn');\nconst cartCountSpan = document.getElementById('cart-count');\nlet itemCount = 0;\n\ncartButtons.forEach(button => {\n  button.addEventListener('click', () => {\n    // Log product ID and update counter\n    itemCount++; \n    cartCountSpan.textContent = String(itemCount);\n    console.log('Added product ID:', button.dataset.productId);\n  });\n});`,
        validate: (code, pc) => {
          if (!pc?.html || !pc.html.includes("id='cart-count'")) return {success:false, message: "Add <span id='cart-count'>0</span> to your HTML header for the counter."};
          if (!code.includes("querySelectorAll('.add-to-cart-btn')") || !code.includes("button.dataset.productId")) return {success: false, message: "Select buttons and get product ID from dataset."};
          if (!code.includes("itemCount++") && !code.includes("itemCount += 1")) return {success: false, message: "Increment itemCount."};
          if (!code.includes("cartCountSpan.textContent = itemCount") && !code.includes("cartCountSpan.textContent = String(itemCount)")) return {success: false, message: "Update cartCountSpan's textContent."};
          return { success: true, message: 'Basic cart functionality implemented!', updatedProjectCode: { ...pc, js: code } };
        }
      }
    ],
    unlocksNextLevel: 'bonus5',
  },
  {
    id: 'bonus5',
    title: 'Bonus: Store Enhancements',
    icon: '✨🛍️',
    description: 'Add a simple client-side filter or sort for products.',
    tasks: [
      {
        id: 'b5.1',
        instruction: "Implement a basic product filter (e.g., by price range or search by name). \n1. Add input fields (e.g., for min/max price or a search term) to your HTML.\n2. Add an event listener (e.g., to a 'Filter' button or on input change).\n3. In the event listener, get filter values. \n4. Filter your `productsData` array based on these values to create a `filteredProducts` array.\n5. Re-render the product grid using `filteredProducts` (clear old grid, loop through new array, append cards).",
        language: Language.JavaScript, // HTML may need inputs
        starterCode: (pc) => pc?.js || `const productsData = []; // Assuming productsData is populated earlier\nconst productGrid = document.querySelector('.product-grid');\nconst searchInput = document.getElementById('searchName');\nconst filterButton = document.getElementById('filterBtn');\n\nfunction renderProducts(productsToRender) {\n  productGrid.innerHTML = '';\n  productsToRender.forEach(product => {\n    const cardHTML = \`\n      <div class='product-card'>\n        <h3>\${product.name}</h3>\n        <p>\$ \${product.price}</p>\n        <button class='add-to-cart-btn' data-product-id='\${product.id}'>Add to Cart</button>\n      </div>\n    \`;\n    productGrid.innerHTML += cardHTML;\n  });\n  // Re-attach cart button listeners if they were specific to renderProducts scope or need re-binding!\n}\n\nif (filterButton) { // Ensure button exists before adding listener\n  filterButton.addEventListener('click', () => {\n    const searchTerm = searchInput.value.toLowerCase();\n    const filtered = productsData.filter(p => p.name.toLowerCase().includes(searchTerm));\n    renderProducts(filtered);\n  });\n}\n\n// renderProducts(productsData); // Initial render should be handled by previous task or on page load.`,
        validate: (code, pc) => {
          if (!pc?.html || !pc.html.includes("id=\"filters\"") && (!pc.html.includes("id=\"searchName\"") && !pc.html.includes("id=\"filterBtn\""))) return {success:false, message: "Add filter input/button to HTML."}
          if (!code.includes("productsData.filter(") || !code.includes("renderProducts(")) {
            return {success: false, message: "Filter productsData and call a render function."};
          }
          if (!code.includes("innerHTML = ''") || !code.includes("forEach(product =>")) { // Inside render function
            return {success: false, message: "Render function should clear grid and loop to add products."}
          }
          return {success: true, message: "Client-side filtering implemented!"};
        }
      }
    ],
    unlocksNextLevel: null, // End of current defined levels
  },
];
