function show_message(message, alert_type){
    let toast = document.getElementById('messages');
    console.log(toast);
    toast.innerHTML = `
        <div aria-live="polite" aria-atomic="true" style="position: relative;">
            <div style="position: absolute; top: 0; right: 0;">
                <div class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                    <div class="toast-header alert_${alert_type}" >
                    <strong class="mr-auto">Message</strong>
                    <button type="button" class="ml-2 mb-1 close" data-dismiss="toast" aria-label="Close">
                        <span aria-hidden="true" class="text-white">&times;</span>
                    </button>
                    </div>
                    <div class="toast-body">
                    <p><b>Alert: </b>${message}</p>
                    </div>
                </div>
            </div>
        </div>

    `;
    $('.toast').toast({
        delay: 4000,
    })
    $('.toast').toast('show');
}

function send_query(){
    let tag = (document.getElementById('querytag').value).trim();

    if(tag == '' || tag == null){
        show_message(`Search Tag can't be Empty`, 'error');
    }else{
        send_post(tag);
    }
}

function send_post(query){
    let form_data = new FormData();
        let csrftoken = getCookie('csrftoken'); 
        form_data.append('csrfmiddlewaretoken',csrftoken);
        form_data.append('query',query);
        var ajax_req = new XMLHttpRequest();
        ajax_req.open("POST", "",true);
        ajax_req.onload = function(eve){
            let response = JSON.parse(ajax_req.response);
            if (response['status'] == 200){
                let article_container = document.getElementById('articles_containers');
                let tags_container = document.getElementById('tags_container');
                let articles_content = '', tags_content = '<span class="badge badge-light">#tags: &nbsp;</span>';
                let articles = JSON.parse(response['articles']);
                let tags = JSON.parse(response['tags']);
                console.log(articles);
                articles.forEach(article => {
                    console.log(article);
                    articles_content += `
                        <div class="col-12 col-sm-12 col-md-5 col-lg-5 col-xl-5" style="width: 18rem;">
                            <a href="${article['article_link']}" target="_blank">
                                <div class="card">
                                    <img class="card-img-top" src="${article['article_image']}" alt="Card image cap">
                                    <div class="card-body">
                                        <h4 style="text-align: center"> ${article['title']} </h4>
                                        <p class="card-text">
                                            By: <b> ${article['creater']} </b> </br>
                                            Published on: ${article['published_on']} </br>
                                            Time to Read: ${article['time_to_read']}
                                        </p>
                                    </div>
                                </div>
                            </a>
                        </div>
                    `;
                });
                tags.forEach(tag => {
                    tags_content += `
                        <span><a href="${tag['tag_link']}" target='_blank' class="badge badge-secondary">${tag['tag_name']}</a>&nbsp;</span>
                    `;
                    
                });
                tags_container.innerHTML = tags_content;
                article_container.innerHTML = articles_content;
                show_message( response['message'], 'success')
            }
            else{
                show_message( response['message'], 'info')
                console.log("Error Occured");
            }
        };
        ajax_req.send(form_data);
}


function getCookie(name) { // Function to generate CRSF Token
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}