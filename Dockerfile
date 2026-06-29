# Use an official Python runtime as a parent image
FROM python:3.13-slim-bookworm

# Set environment varibles
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Create a non-root user
RUN useradd -ms /bin/bash saraswat_press_order_app
RUN groupadd grp_order_app
RUN usermod -G grp_order_app saraswat_press_order_app

# Add all files to container/pod
COPY . /home/saraswat_press_order_app/order/

# Install requirements for the service
RUN pip3 install --no-cache-dir --trusted-host pypi.python.org -r /home/saraswat_press_order_app/order/requirements.txt

# Change ownership of working directory to newly created group
RUN chown -R saraswat_press_order_app:grp_order_app /home/saraswat_press_order_app/order/
RUN export

# Set the user as the active user
USER saraswat_press_order_app

# expose ports
EXPOSE 5555 8888 9203