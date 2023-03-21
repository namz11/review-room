var toolbarOptions = [
    'bold',
    'italic',
    'underline',
    'strike',
    'link',
    { list: 'ordered' },
    { list: 'bullet' },
];
var editOptions = {
    theme: 'snow',
    modules: {
        toolbar: toolbarOptions,
    },
    placeholder: 'Add new comment...',
};
var editOptions2 = {
    theme: 'snow',
    modules: {
        toolbar: false,
    },
    placeholder: 'Add new comment...',
};
var viewOptions = {
    theme: 'bubble',
    modules: {
        toolbar: false,
    },
    readOnly: true,
};
var readOnly = {
    readOnly: true,
};
setQuillEditor = function (id, data) {
    var _id = '#' + id;
    var quill = new Quill(_id, editOptions);
    quill.focus();
    if (data != null) {
        quill.setContents(data);
    }
};
getQuillContent = function (id) {
    var _id = '#' + id;
    var quill = new Quill(_id, readOnly);
    var content = quill.getContents();
    return content;
};
setQuillViewer = function (id, content) {
    var _id = '#' + id;
    var quill = new Quill(_id, viewOptions);
    quill.focus();
    if (content != null) {
        quill.setContents(content);
    }
};
clearQuillContent = function (id) {
    var _id = '#' + id;
    var el = document.querySelector(_id + ' > .ql-editor');
    el.innerHTML = '';
    el.setAttribute('contenteditable', true);
    el.setAttribute('data-placeholder', 'Add new comment...');
    el.placeholder = 'Add new comment...';
};
