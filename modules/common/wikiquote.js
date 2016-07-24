var request = require.safe('request');

/**
 * This is a *very* heavily modified version of the library found here:
 * https://github.com/natetyler/wikiquotes-api
 *
 * Added by Jay Harris on 22/07/2015
 */
(function() {
    var API_URL = 'http://en.wikiquote.org/w/api.php';

    /**
    * Query based on "titles" parameter and return page id.
    * If multiple page ids are returned, choose the first one.
    * Query includes "redirects" option to automatically traverse redirects.
    * All words will be capitalized as this generally yields more consistent results.
    */
    exports.queryTitles = function(titles, success, failure) {
        var url = API_URL + '?format=json&action=query&redirects=&titles=' + titles;
        request.get(url,
            function(error, response, body) {
                if (error || response.statusCode !== 200) {
                    failure('No results');
                    return;
                }
                var result = JSON.parse(body),
                    pages = result.query.pages,
                    pageId = -1;

                for (var p in pages) {
                    var page = pages[p];
                    // api can return invalid recrods, these are marked as "missing"
                    if(!('missing' in page)) {
                        pageId = page.pageid;
                        break;
                    }
                }
                if (pageId > 0) {
                    success(pageId);
                }
                else {
                    failure('No results');
                }
            }
        );
    };

    /**
    * Get the sections for a given page.
    * This makes parsing for quotes more manageable.
    * Returns an array of all "1.x" sections as these usually contain the quotes.
    * If no 1.x sections exists, returns section 1. Returns the titles that were used
    * in case there is a redirect.
    */
    exports.getSectionsForPage = function(pageId, success) {
        var url = API_URL + '?format=json&action=parse&prop=sections&pageid=' + pageId;
        request.get(url, function(failure, response, body) {
            var result = JSON.parse(body),
                sectionArray = [],
                sections = result.parse.sections;

            for (var s = 0; s < sections.length; s++) {
                var splitNum = sections[s].number.split('.');
                if (splitNum.length > 1 && splitNum[0] === '1') {
                    sectionArray.push(sections[s].index);
                }
            }
            // Use section 1 if there are no "1.x" sections
            if (sectionArray.length === 0) {
                sectionArray.push('1');
            }
            success({ titles: result.parse.title, sections: sectionArray });
        });
    };

    /**
    * Get all quotes for a given section.  Most sections will be of the format:
    * <h3> title </h3>
    * <ul>
    *   <li>
    *     Quote text
    *     <ul>
    *       <li> additional info on the quote </li>
    *     </ul>
    *   </li>
    * <ul>
    * <ul> next quote etc... </ul>
    *
    * The quote may or may not contain sections inside <b /> tags.
    *
    * For quotes with bold sections, only the bold part is returned for brevity
    * (usually the bold part is more well known).
    * Otherwise the entire text is returned.  Returns the titles that were used
    * in case there is a redirect.
    */
    exports.getQuotesForSection = function(pageId, sectionIndex, success) {
        var url = API_URL + '?format=json&action=parse&noimages=&pageid=' + pageId + '&section=' + sectionIndex;
        request.get(url, function(failurer, response, body) {
            var result = JSON.parse(body),
                quotes = result.parse.text['*'],
                quoteArray = [],
                regex = /\<li\>((.|\n)*?)\<\/.*\n/g,
                match = quotes.match(regex);

            do {
                match = regex.exec(quotes);
                if (match) {
                    var quote = match[1].trim(),
                        tagRegex = /\<(.|\n)*?\>|\<.*?\/\>/g;
                    quote = quote.replace(tagRegex, '');
                    // Hack to try and stop getting actors names
                    if (quote.length < 25)  {
                        continue;
                    }
                    quoteArray[quoteArray.length] = quote;
                }
            } while (match);

            success({ titles: result.parse.title, quotes: quoteArray });
        });
    };

    /**
    * Get a random quote for the given title search.
    * This function searches for a page id for the given title, chooses a random
    * section from the list of sections for the page, and then chooses a random
    * quote from that section.  Returns the titles that were used in case there
    * is a redirect.
    */
    exports.getRandomQuote = function(titles, success, error) {
        var errorFunction = function(msg) {
            error(msg);
        };

        var chooseQuote = function(quotes) {
            var randomNum = Math.floor(Math.random() * quotes.quotes.length);
            success({ titles: quotes.titles, quote: quotes.quotes[randomNum] });
        };

        var getQuotes = function(pageId, sections) {
            var randomNum = Math.floor(Math.random() * sections.sections.length);
            exports.getQuotesForSection(pageId, sections.sections[randomNum], chooseQuote, errorFunction);
        };

        var getSections = function(pageId) {
            exports.getSectionsForPage(pageId, function(sections) { getQuotes(pageId, sections); }, errorFunction);
        };

        exports.queryTitles(titles, getSections, errorFunction);
    };
}());
