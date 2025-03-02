const { Client } = require('@notionhq/client');
const { NotionToMarkdown } = require('notion-to-md');
const moment = require('moment');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
// or
// import {NotionToMarkdown} from "notion-to-md";

const notion = new Client({
  auth: process.env.NOTION_TOKEN // Notion API client initialization with token
});

// Function to escape code blocks in markdown
function escapeCodeBlock(body) {
  const regex = /```([\s\S]*?)```/g;
  return body.replace(regex, function (match, htmlBlock) {
    return '{% raw %}\n```' + htmlBlock + '```\n{% endraw %}';
  });
}

// Function to sanitize file names by replacing invalid characters
function sanitizeFileName(name) {
  return name.replace(/[^a-zA-Z0-9-_\.]/g, '_'); // Replaces invalid characters with '_'
}

// Initialize NotionToMarkdown with the notion client
const n2m = new NotionToMarkdown({ notionClient: notion });

(async () => {
  // Ensure the '_posts' directory exists
  const root = '_posts';
  fs.mkdirSync(root, { recursive: true });

  const databaseId = process.env.DATABASE_ID;
  // Query the Notion database for posts marked as "public"
  const response = await notion.databases.query({
    database_id: databaseId,
    filter: {
      property: '공개', // Filter by the 'public' checkbox property
      checkbox: {
        equals: true
      }
    }
  });

  // Iterate over the posts in the database
  for (const r of response.results) {
    const id = r.id;

    // Extract the date of creation or custom date if available
    let date = moment(r.created_time).format('YYYY-MM-DD');
    let pdate = r.properties?.['날짜']?.['date']?.['start'];
    if (pdate) {
      date = moment(pdate).format('YYYY-MM-DD');
    }

    // Extract the title of the post
    let title = id;
    let ptitle = r.properties?.['게시물']?.['title'];
    if (ptitle?.length > 0) {
      title = ptitle[0]?.['plain_text'];
    }

    // Sanitize the title to create a valid filename
    const sanitizedTitle = sanitizeFileName(title);

    // Extract tags from the post
    let tags = [];
    let ptags = r.properties?.['태그']?.['multi_select'];
    for (const t of ptags) {
      const n = t?.['name'];
      if (n) {
        tags.push(n);
      }
    }

    // Extract categories from the post
    let cats = [];
    let pcats = r.properties?.['카테고리']?.['multi_select'];
    for (const t of pcats) {
      const n = t?.['name'];
      if (n) {
        cats.push(n);
      }
    }

    // Generate frontmatter for the post
    let fmtags = '';
    let fmcats = '';
    if (tags.length > 0) {
      fmtags += '\ntags: [';
      for (const t of tags) {
        fmtags += t + ', ';
      }
      fmtags += ']';
    }
    if (cats.length > 0) {
      fmcats += '\ncategories: [';
      for (const t of cats) {
        fmcats += t + ', ';
      }
      fmcats += ']';
    }
    const fm = `---
layout: post
date: ${date}
title: "${sanitizedTitle}"${fmtags}${fmcats}
toc: true
toc_sticky: false
math: true
---
`;

    // Convert the Notion page content to markdown
    const mdblocks = await n2m.pageToMarkdown(id);
    let md = n2m.toMarkdownString(mdblocks)['parent'];
    md = escapeCodeBlock(md); // Escape code blocks

    // Generate the file name using date and sanitized title
    const ftitle = `${date}-${sanitizedTitle}.md`;

    // Replace image links with local image paths and download images
    let index = 0;
    let edited_md = md.replace(
      /!\[(.*?)\]\((.*?)\)/g,
      function (match, p1, p2, p3) {
        const dirname = path.join('assets/img', ftitle);
        if (!fs.existsSync(dirname)) {
          fs.mkdirSync(dirname, { recursive: true });
        }
        const filename = path.join(dirname, `${index}.png`);

        // Download the image from the URL
        axios({
          method: 'get',
          url: p2,
          responseType: 'stream'
        })
          .then(function (response) {
            let file = fs.createWriteStream(`${filename}`);
            response.data.pipe(file);
          })
          .catch(function (error) {
            console.log(error);
          });

        let res;
        if (p1 === '') res = '';
        else res = `_${p1}_`;

        // Return markdown image syntax with local path
        return `![${index++}](/${filename})${res}`;
      }
    );

    // Write the generated markdown to a file
    fs.writeFile(path.join(root, ftitle), fm + edited_md, (err) => {
      if (err) {
        console.log(err);
      }
    });
  }
})();
