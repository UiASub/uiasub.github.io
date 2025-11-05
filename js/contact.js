document.addEventListener('DOMContentLoaded', function () {
	var fields = Array.prototype.slice.call(document.querySelectorAll('input[type="text"], input[type="email"], textarea'));

	fields.forEach(function (el) {
		el.addEventListener('focus', function () {
			var id = el.id;
			var container = document.getElementById(id + '-form');
			if (container) {
				container.classList.add('formgroup-active');
				container.classList.remove('formgroup-error');
			}
		});

		el.addEventListener('blur', function () {
			var id = el.id;
			var container = document.getElementById(id + '-form');
			if (container) container.classList.remove('formgroup-active');
		});
	});

	function errorfield(selector) {
		var el = document.querySelector(selector);
		if (el) el.classList.add('formgroup-error');
	}

	var form = document.getElementById('waterform');
	if (form) {
		form.addEventListener('submit', function (e) {
			var stopsubmit = false;
			var name = document.getElementById('name');
			var email = document.getElementById('email');
			if (!name || !email) return;
			if (name.value.trim() === '') {
				errorfield('#name-form');
				stopsubmit = true;
			}
			if (email.value.trim() === '') {
				errorfield('#email-form');
				stopsubmit = true;
			}
			if (stopsubmit) {
				e.preventDefault();
				return false;
			}
		});
	}
});