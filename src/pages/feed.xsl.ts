import type { APIRoute } from "astro";

export const GET: APIRoute = () => {
	const text = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:atom="http://www.w3.org/2005/Atom">
  <xsl:output method="html" encoding="UTF-8" omit-xml-declaration="yes" />
  <xsl:template match="/">
    <html>

    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>订阅 | <xsl:value-of select="atom:feed/atom:title" /></title>
      <link rel="stylesheet" href="/feed.css" />
      <link rel="icon" type="image/x-icon" href="{atom:feed/atom:icon}" />
    </head>

    <body>
      <header>
        <h1>
          <a href="{atom:feed/atom:link[@rel='alternate']/@href}">
            <xsl:value-of select="atom:feed/atom:title" />
          </a>
        </h1>
        <p>
          <xsl:value-of select="atom:feed/atom:subtitle" />
        </p>
      </header>

      <blockquote>
        <p>这是一个 Atom 1.0 格式的订阅源，你可以通过其地址来订阅网站的更新</p>
        <p>通常，你可以直接复制下方的地址，并将其粘贴到你的阅读器中</p>
        <p>
          订阅地址:
          <code id="feed-url"><xsl:value-of select="concat(atom:feed/atom:link[@rel='alternate']/@href, 'feed.xml')" /></code>
          <button type="button" onclick="copy()" class="copy-btn">复制</button>
        </p>
      </blockquote>

      <script>
        function copy() {
          const URL = document.getElementById('feed-url').textContent;
          navigator.clipboard.writeText(URL).then(() => alert('复制成功')).catch((() => alert('复制失败')));
        }
      </script>

      <main>
        <xsl:for-each select="atom:feed/atom:entry">
          <section>
            <article>
              <a href="{atom:link/@href}">
                <xsl:value-of select="atom:title" />
              </a>
              <time>
                <xsl:value-of select="substring(atom:updated, 1, 10)" />
                <xsl:text> </xsl:text>
                <xsl:value-of select="substring(atom:updated, 12, 8)" />
              </time>
            </article>
            <xsl:if test="atom:category">
              <aside>
                <xsl:for-each select="atom:category">
                  <span>#<xsl:value-of select="@term" /></span>
                </xsl:for-each>
              </aside>
            </xsl:if>
          </section>
        </xsl:for-each>
      </main>

      <footer>
        <p>如果你想要访问网站，请点击<a href="{atom:feed/atom:link[@rel='alternate']/@href}"><xsl:value-of select="atom:feed/atom:title" /></a></p>
        <p>
          最后更新于:
          <xsl:value-of select="substring(atom:feed/atom:updated, 1, 10)" />
          <xsl:text> </xsl:text>
          <xsl:value-of select="substring(atom:feed/atom:updated, 12, 8)" />
        </p>
        <p><xsl:value-of select="atom:feed/atom:rights" /></p>
      </footer>
    </body>

    </html>
  </xsl:template>
</xsl:stylesheet>`;

	return new Response(text, { headers: { "Content-Type": "text/xsl" } });
};
