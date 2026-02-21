---
description: Django Forms — React SPA uses JSON APIs; forms only for rare server-rendered pages
globs: "**/forms.py", "**/templates/**/*.html"
alwaysApply: false
---

## Django Forms (Project Standard)

- **Frontend is React (SPA)**: User-facing app consumes JSON APIs; do not render Django forms there.
- **APIs**: Use DRF serializers, not Django forms.
- **Server-rendered only (rare)**: Use Django forms for admin/back-office or exceptional server-rendered flows.
- **Templates**: Do not use Django templates for SPA UI.
- **Validation split**: Forms validate input shape; services enforce business rules.
- **Security**: Always CSRF-protect HTML forms.

### Example (HTML form flow)

Only for admin/back-office pages, not used by the React SPA.

```python
class ProfileForm(forms.Form):
    name = forms.CharField(max_length=100)

def profile_view(request):
    if request.method == 'POST':
        form = ProfileForm(request.POST)
        if form.is_valid():
            ProfileService.update_profile(request.user, form.cleaned_data)
            return redirect('success')
    else:
        form = ProfileForm()
    return render(request, 'profile.html', {'form': form})
```

### Prohibited

- Forms calling models directly for domain logic.
- Using forms in JSON API endpoints.
- Rendering Django forms for SPA-facing routes.
- Returning HTML from API endpoints intended for React.