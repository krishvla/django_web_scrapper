from django.shortcuts import render, redirect, HttpResponse
from django.views.generic import TemplateView
from django.contrib import messages
import json, requests, bs4

class HomePage(TemplateView):
    def get(self, request, *args, **kwargs):
        return render(request, 'home.html')
    def post(self, request, *args, **kwargs):
        context = {}
        status = 200
        Message = "Successfully performed..."
        try:
            articles = []
            html_data = requests.get('https://medium.com/search?q={}'.format(request.POST['query']))
            post_filter = bs4.BeautifulSoup(html_data.text, 'lxml')
            blogs_cards = post_filter.find_all("div", class_='postArticle postArticle--short js-postArticle js-trackPostPresentation')
            count = 0
            for blog_card in blogs_cards:
                creater_name = blog_card.find("a", {"class", "ds-link ds-link--styleSubtle link link--darken link--accent u-accentColor--textNormal u-accentColor--textDarken"})
                time_to_read = blog_card.find("span", {"class", "readingTime"})
                title = blog_card.find("h3")
                date = blog_card.find("time")
                article_image = blog_card.find_all("img")
                read_more_tag = blog_card.find("div", {"class", "postArticle-readMore"})
                article_link = (read_more_tag.find("a")).attrs['href']
                articles.append({
                    'article_number': count,
                    'article_link': article_link,
                    'creater': creater_name.text,
                    'time_to_read': time_to_read.attrs['title'],
                    'title': (title.text).replace(u'\xa0', u' '),
                    'published_on': date.text,
                    'article_image': article_image[1].attrs['src']
                })
                count += 1
            tags_html_data = requests.get('https://medium.com/search/tags?q={}'.format(request.POST['query']))
            tags_post_filter =  bs4.BeautifulSoup(tags_html_data.text, 'lxml')
            tags_list = tags_post_filter.find_all("a", class_="link u-baseColor--link")
            tags = []
            for tag in tags_list:
                tags.append({
                    'tag_name': tag.text,
                    'tag_link': tag.attrs['href']
                })
            context['articles'] = json.dumps(articles)
            context['tags'] = json.dumps(tags)
        except Exception as err:
            status = 300
            messages = str(err)
            print(err)
        context['status'] = status
        context['message'] = Message
        return HttpResponse(json.dumps(context))