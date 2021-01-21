from django.shortcuts import render, redirect, HttpResponse
from django.views.generic import TemplateView
from django.contrib import messages
from .models import *
import json, requests, bs4, time

class HomePage(TemplateView):
    def get(self, request, *args, **kwargs):
        return render(request, 'home.html')
    def post(self, request, *args, **kwargs):
        context = {}
        start_time = time.time()
        status = 200
        Message = "Successfully fetched..."
        data = request.POST
        try:
            query_obj, created = SearchQuery.objects.get_or_create(query = (data['query']).lower())
            if created:
                fetch_data = self.crawl_from_web(request, (data['query']).lower(), data['page_count'])
                articles = fetch_data['articles']
                tags = fetch_data['tags']
                self.save_to_db(request, query_obj, articles, tags, True, True, False)
                context['articles'] = json.dumps(articles)
                context['tags'] = json.dumps(tags)
            
            else:
                nedded_count = int(data['page_count'])*10
                if query_obj.articles_count >= nedded_count:
                    articles_objects = Articles.objects.filter(query= query_obj)
                    articles = articles_objects[nedded_count - 10 : nedded_count]
                    tags = Tags.objects.filter(query=query_obj)
                    articles_arr = []
                    tags_arr = []
                    for article in articles:
                        articles_arr.append({
                            'article_id': article.pk,
                            'article_link': article.article_link,
                            'author': article.author,
                            'time_to_read': article.article_readtime,
                            'title': article.title,
                            'published_on': article.article_publish_on,
                            'article_image': article.article_image,
                            'responses': article.responses

                        })
                    for tag in tags:
                        tags_arr.append({
                            'tag_name': tag.tag,
                            'tag_link': tag.tag_link
                        })
                    context['articles'] = json.dumps(articles_arr)
                    context['tags'] = json.dumps(tags_arr)  
                else:
                    fetch_data = self.crawl_from_web(request, (data['query']).lower(), data['page_count'])
                    articles = fetch_data['articles']
                    tags = fetch_data['tags']
                    self.save_to_db(request, query_obj, articles, tags, True, False, True)
                    context['articles'] = json.dumps(articles)
                    context['tags'] = json.dumps(tags)
            
        except Exception as err:
            status = 501
            Message = 'Error Occured'
            print(err)
        context['status'] = status
        context['message'] = Message
        context['time_taken'] = "{:.3f}".format(time.time() - start_time)
        return HttpResponse(json.dumps(context))

    def crawl_from_web(self, request, query, page_count):
        articles = []
        tags = []
        html_data = requests.get('https://medium.com/search/posts?q={}&count=10&page={}'.format(query, page_count))
        post_filter = bs4.BeautifulSoup(html_data.text, 'lxml')
        blogs_cards = post_filter.find_all("div", class_='postArticle postArticle--short js-postArticle js-trackPostPresentation')
        for blog_card in blogs_cards:
            try:
                creater_name = blog_card.find("a", {"class", "ds-link ds-link--styleSubtle link link--darken link--accent u-accentColor--textNormal u-accentColor--textDarken"})
                time_to_read = blog_card.find("span", {"class", "readingTime"})
                title = blog_card.find("h3")
                date = blog_card.find("time")
                article_image = blog_card.find_all("img")
                read_more_tag = blog_card.find("div", {"class", "postArticle-readMore"})
                article_link = (read_more_tag.find("a")).attrs['href']
                article_responses_div = blog_card.find("div", {"class", "buttonSet u-floatRight"})
                article_responses = blog_card.find("a", {"class", "button button--chromeless u-baseColor--buttonNormal"})
                articles.append({
                    'article_link': article_link,
                    'author': creater_name.text,
                    'time_to_read': time_to_read.attrs['title'],
                    'title': (title.text).replace(u'\xa0', u' '),
                    'published_on': date.text,
                    'responses': article_responses.text,
                    'article_image': article_image[1].attrs['src'] if len(article_image) == 2 else 'https://s3.amazonaws.com/speedsport-news/speedsport-news/wp-content/uploads/2018/07/01082232/image-not-found.png'
                })
            except Exception as err:
                print(err)
                pass
        tags_html_data = requests.get('https://medium.com/search/tags?q={}'.format(request.POST['query']))
        tags_post_filter =  bs4.BeautifulSoup(tags_html_data.text, 'lxml')
        tags_list = tags_post_filter.find_all("a", class_="link u-baseColor--link")
        for tag in tags_list:
            tags.append({
                'tag_name': tag.text,
                'tag_link': tag.attrs['href']
            })
        return {"articles": articles, "tags":tags}

    def save_to_db(self, request, query_obj, articles, tags=[], add_articles = False, add_tags = False, increment_articles_count = False):
        if add_articles:
            for article in articles:
                article_obj = Articles()
                article_obj.query = query_obj
                article_obj.author = article['author']
                article_obj.title = article['title']
                article_obj.article_link = article['article_link']
                article_obj.article_image = article['article_image']
                article_obj.article_readtime = article['time_to_read']
                article_obj.article_publish_on = article['published_on']
                article_obj.responses = article['responses']
                article_obj.save()
        if add_tags:
            for tag in tags:
                tags_obj = Tags()
                tags_obj.query = query_obj
                tags_obj.tag = tag['tag_name']
                tags_obj.tag_link = tag['tag_link']
                tags_obj.save()
        if increment_articles_count:
            SearchQuery.objects.filter(pk = query_obj.pk).update(articles_count = query_obj.articles_count + 10)


