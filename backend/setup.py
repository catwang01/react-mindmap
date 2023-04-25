# packaging_tutorial/setup.py
import setuptools

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setuptools.setup(
    name="reactmindmap-backend",
    version="0.0.1",
    author="catwang01",
    author_email="edwardelricwzx@gmail.com",
    description="Backend project for react mind map",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/catwang01/react-mindmap",
    project_urls={
        "Bug Tracker": "https://github.com/catwang01/react-mindmap/issues"
    },
    packages=setuptools.find_packages(),
    python_requires=">=3.6",
)