from django.db import models


class SearchQuery(models.Model):
    query  = models.CharField(max_length=30, null=False)
    articles_count = models.IntegerField(default=10)
    def __str__(self):
        params = {
            "pk": self.pk,
            'query':self.query,
        }
        return "{pk} - {query}".format(**params)

class Articles(models.Model):
    query = models.ForeignKey('SearchQuery', on_delete=models.CASCADE)
    author = models.CharField(max_length=50, null=False)
    title = models.TextField()
    article_link = models.TextField()
    article_image = models.TextField()
    article_readtime = models.CharField(max_length=50)
    article_publish_on = models.CharField(max_length=30)
    responses = models.CharField(max_length=50, default='0 responses')
    
    def __str__(self):
        params = {
            "pk": self.pk,
            "query": self.query,
            "author": self.author
        }
        return "{pk} - {query} - {author}".format(**params)

class Tags(models.Model):
    query = models.ForeignKey('SearchQuery', on_delete=models.CASCADE)
    tag = models.CharField(max_length=50)
    tag_link = models.TextField(null=True)
    def __str__(self):
        params = {
            "pk": self.pk,
            'tag':self.tag,
        }
        return "{pk} - {tag}".format(**params)